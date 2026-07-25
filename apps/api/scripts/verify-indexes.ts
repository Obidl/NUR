/**
 * Verifies Mongoose schema indexes exist on the connected database.
 * Run against Atlas: `npm run verify:indexes` with MONGODB_URI set.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';

// Import models so schemas/indexes are registered.
import '../src/modules/auth/user.model.js';
import '../src/modules/auth/refreshToken.model.js';
import '../src/modules/quran/surah.model.js';
import '../src/modules/quran/ayah.model.js';
import '../src/modules/quran/quranProgress.model.js';
import '../src/modules/quran/quranBookmark.model.js';
import '../src/modules/podcasts/podcastSeries.model.js';
import '../src/modules/podcasts/podcastEpisode.model.js';
import '../src/modules/podcasts/podcastProgress.model.js';
import '../src/modules/podcasts/podcastFavorite.model.js';
import '../src/modules/videos/videoSeries.model.js';
import '../src/modules/videos/videoEpisode.model.js';
import '../src/modules/books/book.model.js';
import '../src/modules/books/bookChapter.model.js';
import '../src/modules/books/bookProgress.model.js';
import '../src/modules/books/bookBookmark.model.js';
import '../src/modules/books/bookHighlight.model.js';
import '../src/modules/research/research.model.js';
import '../src/modules/research/researchBookmark.model.js';
import '../src/modules/curriculum/curriculum.model.js';
import '../src/modules/curriculum/pathProgress.model.js';
import '../src/modules/auth/passwordResetToken.model.js';

const REQUIRED: Record<string, string[]> = {
  users: ['email_1', 'role_1'],
  refresh_tokens: ['tokenHash_1'],
  surahs: ['number_1'],
  ayahs: ['surahNumber_1_ayahNumber_1', 'globalAyahNumber_1'],
  quran_progress: ['userId_1_mode_1'],
  quran_bookmarks: ['userId_1_surahNumber_1_ayahNumber_1'],
  podcast_series: ['slug_1'],
  podcast_episodes: ['seriesId_1_slug_1'],
  podcast_progress: ['userId_1_episodeId_1'],
  podcast_favorites: ['userId_1_targetType_1_targetId_1'],
  video_series: ['slug_1'],
  video_episodes: ['seriesId_1_slug_1'],
  books: ['slug_1'],
  book_chapters: ['bookId_1_slug_1'],
  book_progress: ['userId_1_bookId_1'],
  book_bookmarks: ['userId_1_bookId_1_chapterId_1'],
  book_highlights: ['userId_1_chapterId_1_createdAt_-1', 'userId_1_bookId_1'],
  research_articles: ['slug_1'],
  research_bookmarks: ['userId_1_articleId_1'],
  learning_paths: ['slug_1'],
  path_progress: ['userId_1_pathId_1'],
};

async function main() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);

  // Ensure schema indexes are created / synced.
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.syncIndexes()),
  );

  let failed = 0;
  for (const [collection, required] of Object.entries(REQUIRED)) {
    const indexes = await mongoose.connection.db!.collection(collection).indexes();
    const names = new Set(indexes.map((idx) => idx.name));
    const missing = required.filter((name) => !names.has(name));
    if (missing.length) {
      failed += 1;
      console.error(`[fail] ${collection}: missing ${missing.join(', ')}`);
      console.error(`       present: ${[...names].join(', ')}`);
    } else {
      console.info(`[ok] ${collection}`);
    }
  }

  await mongoose.disconnect();
  if (failed > 0) {
    console.error(`\nIndex verification failed for ${failed} collection(s).`);
    process.exit(1);
  }
  console.info('\nAll required indexes present.');
}

main().catch((error) => {
  console.error('[verify:indexes] failed', error);
  process.exit(1);
});
