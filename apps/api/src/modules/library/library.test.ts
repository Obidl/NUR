import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { SurahModel } from '../quran/surah.model.js';
import { QuranProgressModel } from '../quran/quranProgress.model.js';
import { PodcastSeriesModel } from '../podcasts/podcastSeries.model.js';
import { PodcastEpisodeModel } from '../podcasts/podcastEpisode.model.js';
import { PodcastProgressModel } from '../podcasts/podcastProgress.model.js';
import { PodcastFavoriteModel } from '../podcasts/podcastFavorite.model.js';
import { BookModel } from '../books/book.model.js';
import { BookChapterModel } from '../books/bookChapter.model.js';
import { BookProgressModel } from '../books/bookProgress.model.js';
import { BookBookmarkModel } from '../books/bookBookmark.model.js';
import { ResearchArticleModel } from '../research/research.model.js';
import { ResearchBookmarkModel } from '../research/researchBookmark.model.js';

/** EXAMPLE — NOT FOR PRODUCTION fixtures */

describe('library API', () => {
  let mongo: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let userToken = '';
  let userId = '';

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    resetEnvCache();
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4000';
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters!!';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters!';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    const env = loadEnv();
    await mongoose.connect(env.MONGODB_URI);
    app = createApp(env);
  }, 60_000);

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      SurahModel.deleteMany({}),
      QuranProgressModel.deleteMany({}),
      PodcastSeriesModel.deleteMany({}),
      PodcastEpisodeModel.deleteMany({}),
      PodcastProgressModel.deleteMany({}),
      PodcastFavoriteModel.deleteMany({}),
      BookModel.deleteMany({}),
      BookChapterModel.deleteMany({}),
      BookProgressModel.deleteMany({}),
      BookBookmarkModel.deleteMany({}),
      ResearchArticleModel.deleteMany({}),
      ResearchBookmarkModel.deleteMany({}),
    ]);

    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'library-user@example.com',
      password: 'password123',
      displayName: 'Reader',
    });
    userToken = reg.body.data.tokens.accessToken;
    userId = reg.body.data.user.id;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    resetEnvCache();
  });

  it('aggregates continue, favorites, and bookmarks', async () => {
    await SurahModel.create({
      number: 1,
      nameArabic: 'الفاتحة',
      nameLatin: 'Al-Faatiha',
      nameUz: 'Fotiha',
      ayahCount: 7,
      revelationType: 'meccan',
    });

    await QuranProgressModel.create({
      userId,
      mode: 'read',
      surahNumber: 1,
      ayahNumber: 1,
    });

    const series = await PodcastSeriesModel.create({
      title: 'Example Series',
      slug: 'example-series',
      description: 'Example series description for tests.',
      hostOrScholar: 'EXAMPLE Host',
      language: 'uz',
      coverUrl: 'https://example.com/c.jpg',
      topics: [],
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });
    const episode = await PodcastEpisodeModel.create({
      seriesId: series._id,
      title: 'Episode 1',
      slug: 'episode-1',
      description: 'Example episode description.',
      audioUrl: 'https://example.com/a.mp3',
      durationSeconds: 100,
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });
    await PodcastProgressModel.create({
      userId,
      episodeId: episode._id,
      positionSeconds: 20,
      durationSeconds: 100,
      completed: false,
    });
    await PodcastFavoriteModel.create({
      userId,
      targetType: 'series',
      targetId: series._id,
    });

    const book = await BookModel.create({
      title: 'Example Book',
      slug: 'example-book',
      authors: ['EXAMPLE'],
      description: 'Example book description.',
      coverUrl: 'https://example.com/b.jpg',
      language: 'uz',
      categories: [],
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });
    const chapter = await BookChapterModel.create({
      bookId: book._id,
      title: 'Chapter 1',
      slug: 'chapter-1',
      order: 1,
      body: '<p>Text</p>',
      bodyFormat: 'html',
      status: 'published',
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });
    await BookProgressModel.create({
      userId,
      bookId: book._id,
      chapterId: chapter._id,
      position: { scrollRatio: 0.2 },
    });
    await BookBookmarkModel.create({
      userId,
      bookId: book._id,
      chapterId: chapter._id,
    });

    const article = await ResearchArticleModel.create({
      title: 'Example Article',
      slug: 'example-article',
      summary: 'Example summary for tests.',
      body: '<p>Body</p>',
      bodyFormat: 'html',
      category: 'fiqh',
      tags: [],
      authors: ['EXAMPLE'],
      sources: [{ title: 'Book', type: 'book', citation: 'EXAMPLE citation' }],
      language: 'uz',
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });
    await ResearchBookmarkModel.create({
      userId,
      articleId: article._id,
    });

    const cont = await request(app)
      .get('/api/v1/library/continue')
      .set('Authorization', `Bearer ${userToken}`);
    expect(cont.status).toBe(200);
    expect(cont.body.data.quran).toHaveLength(1);
    expect(cont.body.data.podcasts).toHaveLength(1);
    expect(cont.body.data.books).toHaveLength(1);

    const fav = await request(app)
      .get('/api/v1/library/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(fav.status).toBe(200);
    expect(fav.body.data.podcasts).toHaveLength(1);

    const marks = await request(app)
      .get('/api/v1/library/bookmarks')
      .set('Authorization', `Bearer ${userToken}`);
    expect(marks.status).toBe(200);
    expect(marks.body.data.books).toHaveLength(1);
    expect(marks.body.data.research).toHaveLength(1);
  });

  it('requires auth', async () => {
    await request(app).get('/api/v1/library/continue').expect(401);
  });
});
