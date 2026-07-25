import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { SurahModel } from '../quran/surah.model.js';
import { PodcastSeriesModel } from '../podcasts/podcastSeries.model.js';
import { BookModel } from '../books/book.model.js';
import { ResearchArticleModel } from '../research/research.model.js';

/** EXAMPLE — NOT FOR PRODUCTION fixtures */

describe('global search API', () => {
  let mongo: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;

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
      SurahModel.deleteMany({}),
      PodcastSeriesModel.deleteMany({}),
      BookModel.deleteMany({}),
      ResearchArticleModel.deleteMany({}),
    ]);

    await SurahModel.create({
      number: 1,
      nameArabic: 'الفاتحة',
      nameLatin: 'Al-Faatiha',
      nameUz: 'Fotiha',
      ayahCount: 7,
      revelationType: 'meccan',
    });

    await PodcastSeriesModel.create({
      title: 'Fotiha darsi',
      slug: 'fotiha-darsi',
      description: 'Example podcast about Fotiha.',
      hostOrScholar: 'EXAMPLE Host',
      coverUrl: 'https://example.com/c.jpg',
      language: 'uz',
      topics: ['quran'],
      status: 'published',
      rights: { licenseStatus: 'owned' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    await BookModel.create({
      title: 'Fotiha tafsiri',
      slug: 'fotiha-tafsiri',
      authors: ['EXAMPLE'],
      description: 'Example book about Fotiha.',
      coverUrl: 'https://example.com/b.jpg',
      language: 'uz',
      categories: [],
      status: 'published',
      rights: { licenseStatus: 'owned' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    await ResearchArticleModel.create({
      title: 'Fotiha haqida tadqiqot',
      slug: 'fotiha-tadqiqot',
      summary: 'Example research summary on Fotiha.',
      body: '<p>Body</p>',
      bodyFormat: 'html',
      category: 'tafsir',
      tags: ['fotiha'],
      authors: ['EXAMPLE'],
      sources: [{ title: 'Book', type: 'book', citation: 'EXAMPLE' }],
      language: 'uz',
      status: 'published',
      rights: { licenseStatus: 'owned' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    await ResearchArticleModel.create({
      title: 'Draft only',
      slug: 'draft-only',
      summary: 'Should not appear in search.',
      body: '<p>Body</p>',
      bodyFormat: 'html',
      category: 'fiqh',
      tags: ['fotiha'],
      authors: ['EXAMPLE'],
      sources: [],
      language: 'uz',
      status: 'draft',
      rights: { licenseStatus: 'unknown' },
      createdBy: new mongoose.Types.ObjectId(),
    });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    resetEnvCache();
  });

  it('returns published hits across types and hides drafts', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'Fotiha' });
    expect(res.status).toBe(200);
    const types = res.body.data.map((h: { type: string }) => h.type);
    expect(types).toEqual(expect.arrayContaining(['quran', 'podcasts', 'books', 'research']));
    expect(res.body.data.some((h: { title: string }) => h.title === 'Draft only')).toBe(false);
  });

  it('filters by types CSV', async () => {
    const res = await request(app)
      .get('/api/v1/search')
      .query({ q: 'Fotiha', types: 'books,research' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((h: { type: string }) => ['books', 'research'].includes(h.type))).toBe(
      true,
    );
  });

  it('requires q', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(422);
  });
});
