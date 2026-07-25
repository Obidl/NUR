/**
 * Owner-approved catalog seed from personal challenge plan (video 2026-07-25).
 *
 * - Qur’an ranges: only if surahs exist (import:quran) — no invented ayah text.
 * - Podcast/book titles & scholars: from owner-approved list.
 * - Audio: temporary placeholder file until owner pastes licensed URLs (G-04).
 * - Book chapter bodies: short stubs only — NOT invented Seerah/hadith text.
 *
 * Usage: cd apps/api && npm run seed:demo
 * Refuses when NODE_ENV=production.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { loadEnv } from '../src/config/env.js';
import { UserModel } from '../src/modules/auth/user.model.js';
import { PodcastSeriesModel } from '../src/modules/podcasts/podcastSeries.model.js';
import { PodcastEpisodeModel } from '../src/modules/podcasts/podcastEpisode.model.js';
import { VideoSeriesModel } from '../src/modules/videos/videoSeries.model.js';
import { VideoEpisodeModel } from '../src/modules/videos/videoEpisode.model.js';
import { BookModel } from '../src/modules/books/book.model.js';
import { BookChapterModel } from '../src/modules/books/bookChapter.model.js';
import { ResearchArticleModel } from '../src/modules/research/research.model.js';
import { LearningPathModel } from '../src/modules/curriculum/curriculum.model.js';
import { SurahModel } from '../src/modules/quran/surah.model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type VideoEpisodeSeed = {
  slug: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  episodeNumber: number;
};

type VideoSeriesSeed = {
  slug: string;
  title: string;
  host: string;
  description: string;
  channelUrl: string;
  language: string;
  episodes: VideoEpisodeSeed[];
};

const siyratYogdusiPack = JSON.parse(
  readFileSync(join(__dirname, 'data/siyrat-yogdusi-videos.json'), 'utf8'),
) as {
  playlistUrl: string;
  channelUrl: string;
  ownerEntryVideoId: string;
  episodes: VideoEpisodeSeed[];
};
const DEMO_EMAIL = 'demo.editor@nur.local';
const DEMO_PASSWORD = 'password123';
const COVER = 'https://placehold.co/600x800/121820/c58b2d?text=NUR';
/** Temporary playback only — replace with licensed URLs (CONTENT_RULES G-04). */
const PLACEHOLDER_AUDIO =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const rights = {
  licenseStatus: 'permission_granted' as const,
  licenseNotes:
    'Owner Husanboy approved catalog. Placeholder audio/book stubs until licensed media/text. YouTube = embed only (not rehosted).',
};

const videoRights = {
  licenseStatus: 'permission_granted' as const,
  licenseNotes:
    'YouTube embed / watch-on-platform; not rehosted. Editorial curated links.',
};

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

const PODCAST_SERIES = [
  {
    slug: 'siyrat-yogdusi',
    title: 'Siyrat yog‘dusi',
    host: 'Islom.uz',
    description:
      'Siyrat ketma-ketligi (owner-approved). Asl audio URL keyin qo‘yiladi; hozircha playback placeholder.',
    topics: ['siyrat', 'uz'],
  },
  {
    slug: 'siyrat-suhbatlari',
    title: 'Siyrat suhbatlari',
    host: 'Hasanxon Yahyo Abdulmajid',
    description:
      'Siyrat suhbatlari (owner-approved). Asl audio URL keyin qo‘yiladi; hozircha playback placeholder.',
    topics: ['siyrat', 'uz'],
  },
  {
    slug: 'shifo-sharhi',
    title: 'Ash-Shifo kitobi sharhi',
    host: 'Husaynxon Yahyo Abdulmajid',
    description:
      'Ash-Shifo sharhi (owner-approved). Asl audio URL keyin qo‘yiladi; hozircha playback placeholder.',
    topics: ['siyrat', 'uz', 'shifo'],
  },
  {
    slug: 'seerah-english-listening',
    title: 'Seerah — English listening',
    host: 'Curated (Yasir Qadhi / Omar Suleiman / Qalam / Ahson Syed)',
    description:
      'Inglizcha listening ro‘yxati (owner-approved). Asl Spotify/YouTube URL keyin; hozircha placeholder.',
    topics: ['siyrat', 'en', 'listening'],
  },
] as const;

const VIDEO_SERIES: VideoSeriesSeed[] = [
  {
    slug: 'siyrat-yogdusi-video',
    title: 'Siyrat yog‘dusi (Islom.uz)',
    host: 'Islom.uz — Qamariddin Bekmuhammad, Yorqin Xalil',
    description:
      'Owner-priority: Rasululloh ﷺ siyrati (bolalik / payg‘ambarlikdan oldin → Makka → Madina). YouTube embed only — playlist PLys356tU5j5QwryNqakQTBiq1dVj7tR5m. Entry: https://youtu.be/D02mw3_tt4c',
    channelUrl: siyratYogdusiPack.channelUrl,
    language: 'uz',
    episodes: siyratYogdusiPack.episodes,
  },
  {
    slug: 'nouman-ali-khan-prophet-lessons',
    title: 'Nouman Ali Khan — Prophet ﷺ lessons',
    host: 'Nouman Ali Khan (Bayyinah)',
    description:
      'Official @bayyinah Prophet ﷺ / seerah lessons via YouTube embed (not rehosted). Extend in admin.',
    channelUrl: 'https://www.youtube.com/@bayyinah',
    language: 'en',
    episodes: [
      {
        slug: 'lessons-from-uhud-to-hajj-ep1',
        title: 'Lessons from Uhud to Hajj | Ep 1 | Prophet’s ﷺ Road to Hajj',
        description:
          'Verified @bayyinah embed — https://www.youtube.com/watch?v=YhWp46tsolk',
        youtubeVideoId: 'YhWp46tsolk',
        episodeNumber: 1,
      },
      {
        slug: 'hudaibiyyah-negotiations-ep2',
        title: 'Struggles of Hudaibiyyah Negotiations | Ep 2 | Prophet’s ﷺ Road to Hajj',
        description:
          'Verified @bayyinah embed — https://www.youtube.com/watch?v=gEClJEMOCCA',
        youtubeVideoId: 'gEClJEMOCCA',
        episodeNumber: 2,
      },
      {
        slug: 'when-they-insult-our-prophet',
        title: '#Muhammad — When They Insult Our Prophet (PBUH)',
        description:
          'Verified @bayyinah embed — https://www.youtube.com/watch?v=I6zuKbBlmRo',
        youtubeVideoId: 'I6zuKbBlmRo',
        episodeNumber: 3,
      },
      {
        slug: 'sending-salawat-on-the-prophet',
        title: 'Sending Salawat on the Prophet ﷺ',
        description:
          'Verified @bayyinah embed — https://www.youtube.com/watch?v=yTN4Jxc6Kh4',
        youtubeVideoId: 'yTN4Jxc6Kh4',
        episodeNumber: 4,
      },
    ],
  },
  {
    slug: 'hasanxon-yahyo-siyrat',
    title: 'Hasanxon Yahyo — Siyrat',
    host: 'Hasanxon Yahyo Abdulmajid',
    description:
      'Siyrat / Rasululloh ﷺ suhbatlari (@Hasanxondomla). YouTube embed only — not rehosted.',
    channelUrl: 'https://www.youtube.com/@Hasanxondomla',
    language: 'uz',
    episodes: [
      {
        slug: 'shamoil-muhammadiya-1',
        title: 'Rosululloh xilqatlari | Shamoilul-Muhammadiya 1-dars',
        description:
          'Verified @Hasanxondomla embed — https://www.youtube.com/watch?v=uRh5fnlPUc4',
        youtubeVideoId: 'uRh5fnlPUc4',
        episodeNumber: 1,
      },
      {
        slug: 'paygambarimiz-magfirat-duosi',
        title: 'Payg‘ambarimiz ﷺ ning Allohdan bizlarni mag‘firat so‘rab duo qilishlari',
        description:
          'Verified @Hasanxondomla embed — https://www.youtube.com/watch?v=P_RiMD-s26g',
        youtubeVideoId: 'P_RiMD-s26g',
        episodeNumber: 2,
      },
      {
        slug: 'eng-katta-muallim-mavlid',
        title: 'Eng katta muallim | MAVLID-1444',
        description:
          'Verified @Hasanxondomla embed — https://www.youtube.com/watch?v=FTBwpeQdwgk',
        youtubeVideoId: 'FTBwpeQdwgk',
        episodeNumber: 3,
      },
      {
        slug: 'yo-rosululloh',
        title: 'Yo Rosululloh ﷺ | Rosulullohni sog‘inganda tinglang',
        description:
          'Verified @Hasanxondomla embed — https://www.youtube.com/watch?v=biNPRapJil4',
        youtubeVideoId: 'biNPRapJil4',
        episodeNumber: 4,
      },
    ],
  },
  {
    slug: 'husaynxon-yahyo-siyrat',
    title: 'Hasanxon & Husaynxon Yahyo — hasanhusayn',
    host: 'Hasanxon, Husaynxon Yahyo Abdulmajid',
    description:
      'Rasmiy YouTube @hasanhusayn (Telegram bilan bir ekosistem). Embed only — not rehosted.',
    channelUrl: 'https://www.youtube.com/@hasanhusayn',
    language: 'uz',
    episodes: [
      {
        slug: 'rasululloh-duolari',
        title: 'Rasulullohning ﷺ duolarini olarmidingiz',
        description:
          'Verified @hasanhusayn embed — https://www.youtube.com/watch?v=LCA4W68c1bE',
        youtubeVideoId: 'LCA4W68c1bE',
        episodeNumber: 1,
      },
      {
        slug: 'niyat-va-qasd',
        title: 'Niyat va qasd | Husaynxon Yahyo Abdulmajid',
        description:
          'Verified @hasanhusayn embed — https://www.youtube.com/watch?v=6ADm1CM48Zc',
        youtubeVideoId: '6ADm1CM48Zc',
        episodeNumber: 2,
      },
      {
        slug: 'bandani-allohdan-nima-tosadi',
        title: 'Bandani Allohdan nima to‘sadi? | Husaynxon Yahyo Abdulmajid',
        description:
          'Verified @hasanhusayn embed — https://www.youtube.com/watch?v=AkEFqRP_WjQ',
        youtubeVideoId: 'AkEFqRP_WjQ',
        episodeNumber: 3,
      },
    ],
  },
];

const BOOKS = [
  {
    slug: 'ar-rahiqul-maxtum',
    title: 'Ar-Rahiqul Maxtum (Muhrlangan jannat)',
    authors: ['Safiyurrahmon Muborakfuriy'],
    description: 'Siyrat kitobi — birinchi o‘qiladigan (owner-approved). To‘liq matn litsenziya bilan import qilinadi.',
    chapters: 10,
  },
  {
    slug: 'shamoili-muhammadiya',
    title: 'Shamoili Muhammadiya',
    authors: ['Imom Termiziy'],
    description: 'Rasululloh ﷺ xulq-atvori (owner-approved). To‘liq matn litsenziya bilan import qilinadi.',
    chapters: 3,
  },
  {
    slug: 'ash-shifo',
    title: 'Ash-Shifo',
    authors: ['Qozi Iyoz'],
    description: 'Ash-Shifo (owner-approved). To‘liq matn litsenziya bilan import qilinadi.',
    chapters: 2,
  },
  {
    slug: 'navaviy-40-hadis',
    title: '40 Hadis (Imom Navaviy)',
    authors: ['Imom Navaviy'],
    description:
      'Navaviy 40 hadis (owner-approved). Hadis matni invent qilinmaydi — litsenziyalangan manbadan import.',
    chapters: 2,
  },
  {
    slug: 'zad-al-maad',
    title: 'Zad al-Ma’ad',
    authors: ['Ibn Qayyim al-Jawziyya'],
    description:
      'Klassik siyrat/fiqh us-siyrat manbasi (katalog). Matn stub — litsenziyalangan nashr kelgach to‘ldiriladi.',
    chapters: 2,
  },
  {
    slug: 'siyrat-ibn-hishom',
    title: 'Siyrat Ibn Hishom (kirish)',
    authors: ['Ibn Hishom'],
    description:
      'Klassik siyrat asosi (katalog stub). To‘liq matn invent qilinmaydi.',
    chapters: 2,
  },
  {
    slug: 'fiqh-us-siyrat-buti',
    title: 'Fiqh us-Siyrat',
    authors: ['Muhammad Said Ramadan al-Buti'],
    description:
      'Zamonaviy siyrat fiqhi (katalog stub). Litsenziyalangan matn kelgach import.',
    chapters: 2,
  },
] as const;

function chapterStub(bookTitle: string, chapterTitle: string, dayTheme?: string) {
  const themeLine = dayTheme
    ? `<p>Bugungi yo‘l mavzusi: <strong>${dayTheme}</strong>.</p>`
    : '';
  return `<p><em>Matn stub.</em> «${bookTitle}» — «${chapterTitle}».</p>${themeLine}<p>To‘liq kitob/hadis matni invent qilinmagan. Litsenziyalangan fayl kelgach almashtiriladi (CONTENT_RULES).</p>`;
}

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing seed when NODE_ENV=production');
  }

  await mongoose.connect(env.MONGODB_URI);
  console.info('[seed:demo] connected — owner-approved catalog');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const editor = await UserModel.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      email: DEMO_EMAIL,
      passwordHash,
      displayName: 'NUR Editor',
      role: 'editor',
      isActive: true,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  const editorId = editor!._id;
  const now = new Date();

  const seriesIds: Record<string, string> = {};
  const episodeIdsBySeries: Record<string, string[]> = {};

  for (const seriesDef of PODCAST_SERIES) {
    const series = await PodcastSeriesModel.findOneAndUpdate(
      { slug: seriesDef.slug },
      {
        title: seriesDef.title,
        slug: seriesDef.slug,
        description: seriesDef.description,
        hostOrScholar: seriesDef.host,
        coverUrl: COVER,
        language: seriesDef.topics.includes('en') ? 'en' : 'uz',
        topics: [...seriesDef.topics],
        status: 'published',
        rights,
        createdBy: editorId,
        publishedAt: now,
        deletedAt: null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    seriesIds[seriesDef.slug] = series!._id.toString();
    episodeIdsBySeries[seriesDef.slug] = [];

    for (let i = 1; i <= 5; i += 1) {
      const theme = DAY_THEMES[i - 1] ?? `Qism ${i}`;
      const ep = await PodcastEpisodeModel.findOneAndUpdate(
        { seriesId: series!._id, slug: `qism-${i}` },
        {
          seriesId: series!._id,
          title: `${seriesDef.title} — ${i}: ${theme}`,
          slug: `qism-${i}`,
          description: `${seriesDef.title} / ${theme}. Placeholder audio — replace with licensed URL.`,
          audioUrl: PLACEHOLDER_AUDIO,
          coverUrl: COVER,
          durationSeconds: 1200 + i * 60,
          episodeNumber: i,
          status: 'published',
          rights,
          createdBy: editorId,
          publishedAt: now,
          deletedAt: null,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );
      episodeIdsBySeries[seriesDef.slug]!.push(ep!._id.toString());
    }
  }

  const videoSeriesIds: Record<string, string> = {};
  const videoEpisodeIdsBySeries: Record<string, string[]> = {};

  for (const seriesDef of VIDEO_SERIES) {
    const isPrimary = seriesDef.slug === 'siyrat-yogdusi-video';
    const coverUrl = isPrimary
      ? `https://i.ytimg.com/vi/${siyratYogdusiPack.ownerEntryVideoId}/hqdefault.jpg`
      : COVER;
    const series = await VideoSeriesModel.findOneAndUpdate(
      { slug: seriesDef.slug },
      {
        title: seriesDef.title,
        slug: seriesDef.slug,
        description: seriesDef.description,
        hostOrScholar: seriesDef.host,
        coverUrl,
        language: seriesDef.language,
        topics: isPrimary ? ['siyrat', 'siyrat-yogdusi', 'priority'] : ['siyrat'],
        channelUrl: seriesDef.channelUrl,
        status: 'published',
        rights: videoRights,
        createdBy: editorId,
        publishedAt: isPrimary ? new Date(now.getTime() + 60_000) : now,
        deletedAt: null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    videoSeriesIds[seriesDef.slug] = series!._id.toString();
    videoEpisodeIdsBySeries[seriesDef.slug] = [];

    for (const epDef of seriesDef.episodes) {
      const ep = await VideoEpisodeModel.findOneAndUpdate(
        { seriesId: series!._id, slug: epDef.slug },
        {
          seriesId: series!._id,
          title: epDef.title,
          slug: epDef.slug,
          description: epDef.description,
          youtubeVideoId: epDef.youtubeVideoId,
          coverUrl: `https://i.ytimg.com/vi/${epDef.youtubeVideoId}/hqdefault.jpg`,
          durationSeconds: null,
          episodeNumber: epDef.episodeNumber,
          status: 'published',
          rights: videoRights,
          createdBy: editorId,
          publishedAt: now,
          deletedAt: null,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );
      videoEpisodeIdsBySeries[seriesDef.slug]!.push(ep!._id.toString());
    }
  }

  const bookMeta: Record<string, { bookId: string; chapterIds: string[] }> = {};

  for (const bookDef of BOOKS) {
    const book = await BookModel.findOneAndUpdate(
      { slug: bookDef.slug },
      {
        title: bookDef.title,
        slug: bookDef.slug,
        authors: [...bookDef.authors],
        translator: null,
        description: bookDef.description,
        coverUrl: COVER,
        language: 'uz',
        categories: ['siyrat'],
        status: 'published',
        rights,
        createdBy: editorId,
        publishedAt: now,
        deletedAt: null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    const chapterIds: string[] = [];
    for (let i = 1; i <= bookDef.chapters; i += 1) {
      const title = `Bob ${i}`;
      const ch = await BookChapterModel.findOneAndUpdate(
        { bookId: book!._id, order: i },
        {
          bookId: book!._id,
          title,
          slug: `bob-${i}`,
          order: i,
          body: chapterStub(bookDef.title, title),
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

    bookMeta[bookDef.slug] = { bookId: book!._id.toString(), chapterIds };
  }

  await ResearchArticleModel.findOneAndUpdate(
    { slug: 'foydali-manbalar' },
    {
      title: 'Foydali manbalar (reference)',
      slug: 'foydali-manbalar',
      summary: 'Owner-approved reference hubs: sunnah.com, quran.com, islamhouse.com.',
      body: '<p>Tashqi manbalar. NUR ularning o‘rnini bosmaydi — o‘qish/tekshirish uchun yo‘naltiradi.</p><ul><li>sunnah.com</li><li>quran.com</li><li>islamhouse.com</li></ul>',
      bodyFormat: 'html',
      category: 'reference',
      tags: ['reference', 'manba'],
      authors: ['NUR Editorial'],
      reviewer: 'Husanboy',
      sources: [
        {
          title: 'sunnah.com',
          type: 'website',
          citation: 'https://sunnah.com',
          url: 'https://sunnah.com',
          notes: 'Hadith reference hub',
        },
        {
          title: 'quran.com',
          type: 'website',
          citation: 'https://quran.com',
          url: 'https://quran.com',
          notes: 'Qur’an reference',
        },
        {
          title: 'islamhouse.com',
          type: 'website',
          citation: 'https://islamhouse.com',
          url: 'https://islamhouse.com',
          notes: 'Books / downloads hub',
        },
      ],
      language: 'uz',
      coverUrl: COVER,
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const surahs = await SurahModel.find({
    number: { $in: QURAN_DAY_PLAN.map((d) => d.surahNumber) },
  }).lean();
  const surahMap = new Map(surahs.map((s) => [s.number, s]));

  const yogdusi = episodeIdsBySeries['siyrat-yogdusi']!;
  const suhbat = episodeIdsBySeries['siyrat-suhbatlari']!;
  const shifoAudio = episodeIdsBySeries['shifo-sharhi']!;
  const enListen = episodeIdsBySeries['seerah-english-listening']!;
  const yogdusiVideos = videoEpisodeIdsBySeries['siyrat-yogdusi-video'] ?? [];
  const nakVideos = videoEpisodeIdsBySeries['nouman-ali-khan-prophet-lessons'] ?? [];
  const hasanxonVideos = videoEpisodeIdsBySeries['hasanxon-yahyo-siyrat'] ?? [];
  const husaynxonVideos = videoEpisodeIdsBySeries['husaynxon-yahyo-siyrat'] ?? [];
  /** Owner entry: 46-son payg‘ambarlikdan oldingi hayot (bolalik…) — then continue playlist. */
  const ownerEntryIdx = Math.max(
    0,
    siyratYogdusiPack.episodes.findIndex(
      (e) => e.youtubeVideoId === siyratYogdusiPack.ownerEntryVideoId,
    ),
  );
  const primaryVideos =
    yogdusiVideos.length > 0
      ? [...yogdusiVideos.slice(ownerEntryIdx), ...yogdusiVideos.slice(0, ownerEntryIdx)]
      : [];
  const allVideos = [...primaryVideos, ...hasanxonVideos, ...nakVideos, ...husaynxonVideos];
  const rahiq = bookMeta['ar-rahiqul-maxtum']!;
  const shamoil = bookMeta['shamoili-muhammadiya']!;
  const shifoBook = bookMeta['ash-shifo']!;
  const hadis = bookMeta['navaviy-40-hadis']!;
  const zad = bookMeta['zad-al-maad']!;

  function podcastForDay(dayIndex: number): string {
    if (dayIndex < 5) return yogdusi[dayIndex % yogdusi.length]!;
    if (dayIndex < 10) return suhbat[(dayIndex - 5) % suhbat.length]!;
    if (dayIndex < 13) return shifoAudio[(dayIndex - 10) % shifoAudio.length]!;
    return enListen[(dayIndex - 13) % enListen.length]!;
  }

  /** Owner-priority: Siyrat yog‘dusi video on Yo‘lda (odd days); start at D02mw3_tt4c. */
  function videoForDay(dayIndex: number): string | null {
    if (primaryVideos.length === 0) {
      if (allVideos.length === 0) return null;
      if (dayIndex % 2 === 1) return allVideos[dayIndex % allVideos.length]!;
      return null;
    }
    if (dayIndex % 2 === 1) {
      return primaryVideos[Math.floor(dayIndex / 2) % primaryVideos.length]!;
    }
    return null;
  }

  function bookForDay(dayIndex: number): { bookId: string; chapterId: string } {
    if (dayIndex < 8) {
      return {
        bookId: rahiq.bookId,
        chapterId: rahiq.chapterIds[dayIndex % rahiq.chapterIds.length]!,
      };
    }
    if (dayIndex < 11) {
      return {
        bookId: shamoil.bookId,
        chapterId: shamoil.chapterIds[(dayIndex - 8) % shamoil.chapterIds.length]!,
      };
    }
    if (dayIndex < 13) {
      return {
        bookId: shifoBook.bookId,
        chapterId: shifoBook.chapterIds[(dayIndex - 11) % shifoBook.chapterIds.length]!,
      };
    }
    if (dayIndex === 13) {
      return { bookId: zad.bookId, chapterId: zad.chapterIds[0]! };
    }
    return { bookId: hadis.bookId, chapterId: hadis.chapterIds[0]! };
  }

  const pathModules = DAY_THEMES.map((theme, index) => {
    const day = index + 1;
    const plan = QURAN_DAY_PLAN[index]!;
    const surah = surahMap.get(plan.surahNumber);
    const videoId = videoForDay(index);
    const episodeId = podcastForDay(index);
    const bookRef = bookForDay(index);

    const lessons: Array<{
      title: string;
      order: number;
      estimatedMinutes: number;
      targetType: 'quran_range' | 'podcast_episode' | 'video_episode' | 'book_chapter';
      targetRef: Record<string, unknown>;
    }> = [];

    if (surah && plan.ayahTo <= surah.ayahCount) {
      lessons.push({
        title: `Ertalab: Qur’on ${plan.surahNumber}:${plan.ayahFrom}–${plan.ayahTo}`,
        order: 1,
        estimatedMinutes: 25,
        targetType: 'quran_range',
        targetRef: {
          surahNumber: plan.surahNumber,
          ayahFrom: plan.ayahFrom,
          ayahTo: plan.ayahTo,
        },
      });
    }

    if (videoId) {
      lessons.push({
        title: `Yo‘lda (video): ${theme}`,
        order: lessons.length + 1,
        estimatedMinutes: 35,
        targetType: 'video_episode',
        targetRef: { episodeId: videoId },
      });
    } else {
      lessons.push({
        title: `Yo‘lda: ${theme}`,
        order: lessons.length + 1,
        estimatedMinutes: 35,
        targetType: 'podcast_episode',
        targetRef: { episodeId },
      });
    }

    lessons.push({
      title: `Kechqurun: o‘qish — ${theme}`,
      order: lessons.length + 1,
      estimatedMinutes: 45,
      targetType: 'book_chapter',
      targetRef: bookRef,
    });

    return {
      title: `Kun ${day}/15 · ${theme}`,
      order: day,
      summary: `Ertalab Qur’on · Yo‘lda siyrat (podcast/video) · Kechqurun kitob. Mavzu: ${theme}.`,
      lessons,
    };
  });

  await LearningPathModel.findOneAndUpdate(
    { slug: 'siyrat-15-kun' },
    {
      title: '15 kun: Rasululloh ﷺ ni yaqindan tanish',
      slug: 'siyrat-15-kun',
      summary:
        'Owner-approved yo‘l. Har kun: Qur’on + siyrat (podcast yoki video) + kitob. Media litsenziya bilan yangilanadi.',
      coverUrl: COVER,
      language: 'uz',
      authors: ['NUR Editorial', 'Husanboy'],
      modules: pathModules,
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  // Keep old slug pointing at same journey for bookmarks/links
  await LearningPathModel.findOneAndUpdate(
    { slug: 'example-demo-path' },
    {
      title: '15 kun: Rasululloh ﷺ ni yaqindan tanish',
      slug: 'example-demo-path',
      summary:
        'Legacy slug — same owner-approved 15-day path. Prefer /curriculum/siyrat-15-kun.',
      coverUrl: COVER,
      language: 'uz',
      authors: ['NUR Editorial', 'Husanboy'],
      modules: pathModules,
      status: 'published',
      rights,
      createdBy: editorId,
      publishedAt: now,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const quranDays = pathModules.filter((m) =>
    m.lessons.some((l) => l.targetType === 'quran_range'),
  ).length;

  console.info('[seed:demo] done', {
    editor: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    path: '/curriculum/siyrat-15-kun',
    days: 15,
    quranDaysLinked: quranDays,
    series: Object.keys(seriesIds),
    videos: Object.keys(videoSeriesIds),
    books: Object.keys(bookMeta),
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[seed:demo] failed', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
