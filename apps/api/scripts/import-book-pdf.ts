/**
 * Import a book PDF into Mongo as structured chapters.
 *
 * Default: status=draft. Refuse --publish when licenseStatus is unknown (CONTENT_RULES B-02).
 *
 * Usage:
 *   cd apps/api
 *   npx tsx scripts/import-book-pdf.ts --manifest content/books/manifests/ar-rahiq-al-maxtum.json
 *   npx tsx scripts/import-book-pdf.ts --manifest ... --dry-run
 *   npx tsx scripts/import-book-pdf.ts --manifest ... --publish   # requires non-unknown rights
 *
 * Next books: drop PDF into content/books/incoming/<slug>.pdf, add a manifest, run again.
 */
import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { UserModel } from '../src/modules/auth/user.model.js';
import { BookModel } from '../src/modules/books/book.model.js';
import { BookChapterModel } from '../src/modules/books/bookChapter.model.js';
import { sanitizeChapterBody } from '../src/shared/utils/sanitize.js';
import type { RightsInfo } from '../src/shared/types/rights.js';
import { extractPdfText, textToChapterHtml } from './lib/bookPdfText.js';
import { splitByMarkers, type ChapterMarker, type SplitChapter } from './lib/splitBookChapters.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOOKS_ROOT = join(__dirname, '../content/books');

type HadithRange = { title: string; slug: string; from: number; to: number };

type BookManifest = {
  slug: string;
  title: string;
  authors: string[];
  translator?: string | null;
  description: string;
  coverUrl: string;
  language?: string;
  categories?: string[];
  pdf: string;
  rights: RightsInfo;
  splitMode?: 'markers' | 'hadith-ranges';
  chapterMarkers?: ChapterMarker[];
  hadithChapters?: HadithRange[];
};

function parseArgs(argv: string[]) {
  let manifestPath = '';
  let dryRun = false;
  let publish = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--manifest') manifestPath = argv[++i] ?? '';
    else if (a === '--dry-run') dryRun = true;
    else if (a === '--publish') publish = true;
  }
  if (!manifestPath) {
    throw new Error('Required: --manifest <path-to-manifest.json>');
  }
  return { manifestPath: resolve(manifestPath), dryRun, publish };
}

function splitByHadithRanges(text: string, ranges: HadithRange[]): SplitChapter[] {
  const lines = text.split(/\n/);
  type HadithPos = { num: number; lineIdx: number; charIdx: number };
  const positions: HadithPos[] = [];
  let charOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\d+)\.\s+\S/);
    if (m) positions.push({ num: parseInt(m[1]), lineIdx: i, charIdx: charOffset });
    charOffset += lines[i].length + 1;
  }

  const chapters: SplitChapter[] = [];
  for (let ri = 0; ri < ranges.length; ri++) {
    const range = ranges[ri]!;
    const first = positions.find((p) => p.num === range.from);
    if (!first) throw new Error(`Hadith ${range.from} not found in text`);

    const nextRange = ranges[ri + 1];
    let endChar: number;
    if (nextRange) {
      const nextFirst = positions.find((p) => p.num === nextRange.from);
      endChar = nextFirst ? nextFirst.charIdx : text.length;
    } else {
      endChar = text.length;
    }

    const body = text.slice(first.charIdx, endChar).trim();
    chapters.push({ title: range.title, slug: range.slug, order: ri + 1, body });
  }
  return chapters;
}

async function resolveEditorId(): Promise<mongoose.Types.ObjectId> {
  const editor =
    (await UserModel.findOne({ role: { $in: ['admin', 'editor'] }, isActive: true }).sort({
      role: 1,
    })) ?? (await UserModel.findOne({ isActive: true }));
  if (!editor) {
    throw new Error('No active user found to set createdBy — run upsert:admin first');
  }
  return editor._id;
}

async function main() {
  const { manifestPath, dryRun, publish } = parseArgs(process.argv.slice(2));
  const env = loadEnv();

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BookManifest;
  const mode = manifest.splitMode ?? 'markers';
  if (!manifest.slug || !manifest.pdf) {
    throw new Error('Manifest missing slug or pdf');
  }
  if (mode === 'markers' && !manifest.chapterMarkers?.length) {
    throw new Error('Manifest missing chapterMarkers for markers split mode');
  }
  if (mode === 'hadith-ranges' && !manifest.hadithChapters?.length) {
    throw new Error('Manifest missing hadithChapters for hadith-ranges split mode');
  }

  if (publish && manifest.rights.licenseStatus === 'unknown') {
    throw new Error(
      'Refusing --publish: rights.licenseStatus is unknown (CONTENT_RULES). Update the manifest first.',
    );
  }

  const pdfPath = resolve(BOOKS_ROOT, manifest.pdf);
  console.info('[import-book-pdf] extracting', pdfPath);
  const text = await extractPdfText(pdfPath);

  const extractedDir = join(BOOKS_ROOT, 'extracted');
  mkdirSync(extractedDir, { recursive: true });
  const extractedPath = join(extractedDir, `${manifest.slug}.txt`);
  writeFileSync(extractedPath, text, 'utf8');
  console.info('[import-book-pdf] wrote', extractedPath, `(${text.length} chars)`);

  const chapters: SplitChapter[] =
    mode === 'hadith-ranges'
      ? splitByHadithRanges(text, manifest.hadithChapters!)
      : splitByMarkers(text, manifest.chapterMarkers!);
  console.info('[import-book-pdf] chapters', chapters.length);
  for (const ch of chapters) {
    console.info(`  ${ch.order}. ${ch.slug} — ${ch.body.length} chars — ${ch.title}`);
  }

  if (dryRun) {
    console.info('[import-book-pdf] dry-run complete — no DB writes');
    return;
  }

  await mongoose.connect(env.MONGODB_URI);
  const editorId = await resolveEditorId();
  const status = publish ? 'published' : 'draft';
  const now = publish ? new Date() : null;

  const book = await BookModel.findOneAndUpdate(
    { slug: manifest.slug },
    {
      title: manifest.title,
      slug: manifest.slug,
      authors: manifest.authors,
      translator: manifest.translator ?? null,
      description: manifest.description,
      coverUrl: manifest.coverUrl,
      language: manifest.language ?? 'uz',
      categories: manifest.categories ?? [],
      status,
      rights: {
        licenseStatus: manifest.rights.licenseStatus,
        licenseNotes: manifest.rights.licenseNotes ?? null,
      },
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  if (!book) throw new Error('Book upsert failed');

  await BookChapterModel.deleteMany({ bookId: book._id });

  for (const ch of chapters) {
    const body = sanitizeChapterBody(textToChapterHtml(ch.body), 'html');
    await BookChapterModel.create({
      bookId: book._id,
      title: ch.title.slice(0, 200),
      slug: ch.slug,
      order: ch.order,
      body,
      bodyFormat: 'html',
      status,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    });
  }

  console.info('[import-book-pdf] ok', {
    bookId: String(book._id),
    slug: book.slug,
    status: book.status,
    chapters: chapters.length,
    licenseStatus: book.rights.licenseStatus,
  });

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('[import-book-pdf] failed', error);
  process.exitCode = 1;
});
