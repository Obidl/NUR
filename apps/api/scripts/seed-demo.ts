/**
 * EXAMPLE — NOT FOR PRODUCTION
 *
 * Seeds demo podcast / book / research / curriculum so local UI is browsable.
 * Does NOT invent Qur’anic text (Qur’an must be imported separately via import:quran).
 * All titles/authors are explicitly marked EXAMPLE.
 *
 * Curriculum: 15-day EXAMPLE «siyrat» path — Kun 1…15, each with
 * Ertalab (Qur’on) → Yo‘lda (podcast) → Kechqurun (kitob).
 *
 * Usage:
 *   cd apps/api && npm run seed:demo
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { loadEnv } from '../src/config/env.js';
import { UserModel } from '../src/modules/auth/user.model.js';
import { PodcastSeriesModel } from '../src/modules/podcasts/podcastSeries.model.js';
import { PodcastEpisodeModel } from '../src/modules/podcasts/podcastEpisode.model.js';
import { BookModel } from '../src/modules/books/book.model.js';
import { BookChapterModel } from '../src/modules/books/bookChapter.model.js';
import { ResearchArticleModel } from '../src/modules/research/research.model.js';
import { LearningPathModel } from '../src/modules/curriculum/curriculum.model.js';
import { SurahModel } from '../src/modules/quran/surah.model.js';

const DEMO_EMAIL = 'demo.editor@nur.local';
const DEMO_PASSWORD = 'password123';
const EXAMPLE_COVER = 'https://placehold.co/600x800/1a1a1a/c9a227?text=EXAMPLE';
/** Public sample MP3 for UI playback only — EXAMPLE audio, not religious content. */
const EXAMPLE_AUDIO =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const rights = {
  licenseStatus: 'owned' as const,
  licenseNotes: 'EXAMPLE — NOT FOR PRODUCTION local demo seed',
};

/** Editorial theme labels only — EXAMPLE curriculum structure, not a fatwa syllabus. */
const DAY_THEMES = [
  'Bolalik',
  'Payg‘ambarlikdan oldin',
  'Vahiy boshlanishi',
  'Makka — dastlabki chaqiriq',
  'Makka — sabr',
  'Hijratga tayyorgarlik',
  'Hijrat',
  'Madina — jamiyat',
  'Uhud saboqlari',
  'Sulh va ochiqlik',
  'Fath Makka',
  'Xutbatul Vado’',
  'Oxirgi kunlar',
  'Sahoba muhabbati',
  'Yo‘lni davom ettirish',
] as const;

/**
 * Short, common surah ranges (verified only if present in DB after import:quran).
 * EXAMPLE schedule — not a claimed authentic 15-day Qur’an syllabus.
 */
const QURAN_DAY_PLAN: Array<{ surahNumber: number; ayahFrom: number; ayahTo: number }> = [
  { surahNumber: 1, ayahFrom: 1, ayahTo: 7 },
  { surahNumber: 112, ayahFrom: 1, ayahTo: 4 },
  { surahNumber: 113, ayahFrom: 1, ayahTo: 5 },
  { surahNumber: 114, ayahFrom: 1, ayahTo: 6 },
  { surahNumber: 108, ayahFrom: 1, ayahTo: 3 },
  { surahNumber: 109, ayahFrom: 1, ayahTo: 6 },
  { surahNumber: 110, ayahFrom: 1, ayahTo: 3 },
  { surahNumber: 111, ayahFrom: 1, ayahTo: 5 },
  { surahNumber: 103, ayahFrom: 1, ayahTo: 3 },
  { surahNumber: 105, ayahFrom: 1, ayahTo: 5 },
  { surahNumber: 106, ayahFrom: 1, ayahTo: 4 },
  { surahNumber: 107, ayahFrom: 1, ayahTo: 7 },
  { surahNumber: 97, ayahFrom: 1, ayahTo: 5 },
  { surahNumber: 94, ayahFrom: 1, ayahTo: 8 },
  { surahNumber: 93, ayahFrom: 1, ayahTo: 11 },
];

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed EXAMPLE demo data when NODE_ENV=production');
  }

  await mongoose.connect(env.MONGODB_URI);
  console.info('[seed:demo] connected (EXAMPLE — NOT FOR PRODUCTION)');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const editor = await UserModel.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      email: DEMO_EMAIL,
      passwordHash,
      displayName: 'EXAMPLE Demo Editor',
      role: 'editor',
      isActive: true,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  const editorId = editor!._id;
  const now = new Date();

  const series = await PodcastSeriesModel.findOneAndUpdate(
    { slug: 'example-demo-series' },
    {
      title: 'EXAMPLE — Demo siyrat podcast',
      slug: 'example-demo-series',
      description:
        'EXAMPLE — NOT FOR PRODUCTION. Lokal UI uchun namunaviy seriya. Haqiqiy olim emas.',
      hostOrScholar: 'EXAMPLE Host — NOT FOR PRODUCTION',
      coverUrl: EXAMPLE_COVER,
      language: 'uz',
      topics: ['example', 'demo', 'siyra'],
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const episodeIds: string[] = [];
  for (let i = 1; i <= 5; i += 1) {
    const ep = await PodcastEpisodeModel.findOneAndUpdate(
      { seriesId: series!._id, slug: `example-episode-${i}` },
      {
        seriesId: series!._id,
        title: `EXAMPLE — Siyrat epizod ${i}`,
        slug: `example-episode-${i}`,
        description: `EXAMPLE — NOT FOR PRODUCTION. Kunlik yo‘l demo audio ${i}.`,
        audioUrl: EXAMPLE_AUDIO,
        coverUrl: EXAMPLE_COVER,
        durationSeconds: 300 + i * 30,
        episodeNumber: i,
        status: 'published',
        rights,
        createdBy: editorId,
        publishedAt: now,
        deletedAt: null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    episodeIds.push(ep!._id.toString());
  }

  const book = await BookModel.findOneAndUpdate(
    { slug: 'example-demo-book' },
    {
      title: 'EXAMPLE — Demo siyrat kitobi',
      slug: 'example-demo-book',
      authors: ['EXAMPLE Author — NOT FOR PRODUCTION'],
      translator: null,
      description:
        'EXAMPLE — NOT FOR PRODUCTION. O‘qish UI, progress va 15 kunlik yo‘l demo uchun.',
      coverUrl: EXAMPLE_COVER,
      language: 'uz',
      categories: ['example', 'siyra'],
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const chapterIds: string[] = [];
  for (let i = 1; i <= 5; i += 1) {
    const ch = await BookChapterModel.findOneAndUpdate(
      { bookId: book!._id, order: i },
      {
        bookId: book!._id,
        title: `EXAMPLE — Bob ${i}`,
        slug: `bob-${i}`,
        order: i,
        body: `<p>EXAMPLE — NOT FOR PRODUCTION.</p><p>Bob ${i}: faqat o‘qish interfeysi. Diniy hukm yoki uydirma oyat emas.</p>`,
        bodyFormat: 'html',
        status: 'published',
        createdBy: editorId,
        publishedAt: now,
        deletedAt: null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    chapterIds.push(ch!._id.toString());
  }

  await BookChapterModel.deleteMany({
    bookId: book!._id,
    _id: { $nin: chapterIds.map((id) => new mongoose.Types.ObjectId(id)) },
  });

  await ResearchArticleModel.findOneAndUpdate(
    { slug: 'example-demo-article' },
    {
      title: 'EXAMPLE — Demo tadqiqot maqolasi',
      slug: 'example-demo-article',
      summary:
        'EXAMPLE — NOT FOR PRODUCTION. Manbalar UI va publish gate namoyishi uchun.',
      body: '<p>EXAMPLE — NOT FOR PRODUCTION. Bu matn demo. Fatvo yoki hukm emas.</p>',
      bodyFormat: 'html',
      category: 'example',
      tags: ['example', 'demo'],
      authors: ['EXAMPLE Scholar — NOT FOR PRODUCTION'],
      reviewer: 'EXAMPLE Reviewer — NOT FOR PRODUCTION',
      sources: [
        {
          title: 'EXAMPLE Source Book',
          type: 'book',
          citation: 'EXAMPLE Author, Demo Title, p. 1 — NOT FOR PRODUCTION',
          url: null,
          notes: 'Demo source only',
        },
      ],
      language: 'uz',
      coverUrl: EXAMPLE_COVER,
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const surahNumbers = QURAN_DAY_PLAN.map((d) => d.surahNumber);
  const surahs = await SurahModel.find({ number: { $in: surahNumbers } }).lean();
  const surahMap = new Map(surahs.map((s) => [s.number, s]));

  const pathModules = DAY_THEMES.map((theme, index) => {
    const day = index + 1;
    const plan = QURAN_DAY_PLAN[index]!;
    const surah = surahMap.get(plan.surahNumber);
    const episodeId = episodeIds[(index) % episodeIds.length]!;
    const chapterId = chapterIds[(index) % chapterIds.length]!;

    const lessons: Array<{
      title: string;
      order: number;
      estimatedMinutes: number;
      targetType: 'quran_range' | 'podcast_episode' | 'book_chapter';
      targetRef: Record<string, unknown>;
    }> = [];

    if (surah && plan.ayahTo <= surah.ayahCount) {
      lessons.push({
        title: `EXAMPLE — Ertalab: Qur’on (${plan.surahNumber}:${plan.ayahFrom}–${plan.ayahTo})`,
        order: 1,
        estimatedMinutes: 20,
        targetType: 'quran_range',
        targetRef: {
          surahNumber: plan.surahNumber,
          ayahFrom: plan.ayahFrom,
          ayahTo: plan.ayahTo,
        },
      });
    }

    lessons.push({
      title: `EXAMPLE — Yo‘lda: epizod ${(index % episodeIds.length) + 1}`,
      order: lessons.length + 1,
      estimatedMinutes: 30,
      targetType: 'podcast_episode',
      targetRef: { episodeId },
    });

    lessons.push({
      title: `EXAMPLE — Kechqurun: bob ${(index % chapterIds.length) + 1}`,
      order: lessons.length + 1,
      estimatedMinutes: 40,
      targetType: 'book_chapter',
      targetRef: {
        bookId: book!._id.toString(),
        chapterId,
      },
    });

    return {
      title: `EXAMPLE — Kun ${day}/15 · ${theme}`,
      order: day,
      summary: `EXAMPLE — NOT FOR PRODUCTION. Kunlik blok: Qur’on + podcast + kitob. Mavzu yorlig‘i: ${theme}.`,
      lessons,
    };
  });

  await LearningPathModel.findOneAndUpdate(
    { slug: 'example-demo-path' },
    {
      title: 'EXAMPLE — 15 kun: Rasululloh ﷺ ni yaqindan tanish',
      slug: 'example-demo-path',
      summary:
        'EXAMPLE — NOT FOR PRODUCTION. Ideal loyiha demo: 15 kun, har kuni Ertalab (Qur’on) → Yo‘lda (podcast) → Kechqurun (kitob). Haqiqiy litsenziyalangan kontent emas.',
      coverUrl: EXAMPLE_COVER,
      language: 'uz',
      authors: ['EXAMPLE Editor — NOT FOR PRODUCTION'],
      modules: pathModules,
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const quranDaysLinked = pathModules.filter((m) =>
    m.lessons.some((l) => l.targetType === 'quran_range'),
  ).length;

  console.info('[seed:demo] done', {
    editor: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    podcast: '/podcasts/example-demo-series',
    book: '/books/example-demo-book/bob-1',
    research: '/research/example-demo-article',
    curriculum: '/curriculum/example-demo-path',
    days: 15,
    quranDaysLinked,
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[seed:demo] failed', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
