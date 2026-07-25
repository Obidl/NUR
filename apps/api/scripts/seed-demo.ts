/**
 * EXAMPLE — NOT FOR PRODUCTION
 *
 * Seeds demo podcast / book / research / curriculum so local UI is browsable.
 * Does NOT invent Qur’anic text (Qur’an must be imported separately via import:quran).
 * All titles/authors are explicitly marked EXAMPLE.
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
      title: 'EXAMPLE — Demo podcast seriyasi',
      slug: 'example-demo-series',
      description:
        'EXAMPLE — NOT FOR PRODUCTION. Lokal UI uchun namunaviy seriya. Haqiqiy olim emas.',
      hostOrScholar: 'EXAMPLE Host — NOT FOR PRODUCTION',
      coverUrl: EXAMPLE_COVER,
      language: 'uz',
      topics: ['example', 'demo'],
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const episode = await PodcastEpisodeModel.findOneAndUpdate(
    { seriesId: series!._id, slug: 'example-episode-1' },
    {
      seriesId: series!._id,
      title: 'EXAMPLE — 1-epizod',
      slug: 'example-episode-1',
      description: 'EXAMPLE — NOT FOR PRODUCTION. Playback UI ni sinash uchun.',
      audioUrl: EXAMPLE_AUDIO,
      coverUrl: EXAMPLE_COVER,
      durationSeconds: 360,
      episodeNumber: 1,
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const book = await BookModel.findOneAndUpdate(
    { slug: 'example-demo-book' },
    {
      title: 'EXAMPLE — Demo kitob',
      slug: 'example-demo-book',
      authors: ['EXAMPLE Author — NOT FOR PRODUCTION'],
      translator: null,
      description:
        'EXAMPLE — NOT FOR PRODUCTION. O‘qish UI, progress va highlightlarni sinash uchun.',
      coverUrl: EXAMPLE_COVER,
      language: 'uz',
      categories: ['example'],
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const chapter = await BookChapterModel.findOneAndUpdate(
    { bookId: book!._id, slug: 'kirish' },
    {
      bookId: book!._id,
      title: 'EXAMPLE — Kirish',
      slug: 'kirish',
      order: 1,
      body: '<p>EXAMPLE — NOT FOR PRODUCTION.</p><p>Bu bob faqat o‘qish interfeysini ko‘rsatish uchun. Diniy hukm yoki uydirma oyat emas.</p>',
      bodyFormat: 'html',
      status: 'published',
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const article = await ResearchArticleModel.findOneAndUpdate(
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

  const fatiha = await SurahModel.findOne({ number: 1 }).lean();
  const pathModules = fatiha
    ? [
        {
          title: 'EXAMPLE — Modul 1',
          order: 1,
          summary: 'Qur’on (import qilingan) + demo tadqiqot',
          lessons: [
            {
              title: 'EXAMPLE — Fotiha o‘qish',
              order: 1,
              estimatedMinutes: 5,
              targetType: 'quran_range' as const,
              targetRef: { surahNumber: 1, ayahFrom: 1, ayahTo: 7 },
            },
            {
              title: 'EXAMPLE — Demo maqola',
              order: 2,
              estimatedMinutes: 3,
              targetType: 'research_article' as const,
              targetRef: { articleId: article!._id.toString() },
            },
            {
              title: 'EXAMPLE — Demo bob',
              order: 3,
              estimatedMinutes: 4,
              targetType: 'book_chapter' as const,
              targetRef: {
                bookId: book!._id.toString(),
                chapterId: chapter!._id.toString(),
              },
            },
            {
              title: 'EXAMPLE — Demo epizod',
              order: 4,
              estimatedMinutes: 6,
              targetType: 'podcast_episode' as const,
              targetRef: { episodeId: episode!._id.toString() },
            },
          ],
        },
      ]
    : [
        {
          title: 'EXAMPLE — Modul 1',
          order: 1,
          summary: 'Qur’on import qilinmagan — faqat demo maqola',
          lessons: [
            {
              title: 'EXAMPLE — Demo maqola',
              order: 1,
              estimatedMinutes: 3,
              targetType: 'research_article' as const,
              targetRef: { articleId: article!._id.toString() },
            },
          ],
        },
      ];

  await LearningPathModel.findOneAndUpdate(
    { slug: 'example-demo-path' },
    {
      title: 'EXAMPLE — Demo o‘quv yo‘li',
      slug: 'example-demo-path',
      summary:
        'EXAMPLE — NOT FOR PRODUCTION. Mavjud kontentga bog‘langan namunaviy yo‘l.',
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

  console.info('[seed:demo] done', {
    editor: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    podcast: '/podcasts/example-demo-series',
    book: '/books/example-demo-book/kirish',
    research: '/research/example-demo-article',
    curriculum: '/curriculum/example-demo-path',
    quranLinked: Boolean(fatiha),
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[seed:demo] failed', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
