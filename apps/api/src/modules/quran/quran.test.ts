import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { SurahModel } from './surah.model.js';
import { AyahModel } from './ayah.model.js';
import { ReciterModel } from './reciter.model.js';
import { QuranAudioModel } from './quranAudio.model.js';
import { QuranProgressModel } from './quranProgress.model.js';
import { QuranBookmarkModel } from './quranBookmark.model.js';

type CloudSurahResponse = {
  code: number;
  data: {
    number: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
    revelationType: string;
    ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
  };
};

describe('quran API', () => {
  let mongo: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let accessToken = '';
  let reciterId = '';

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
    await Promise.all([
      SurahModel.syncIndexes(),
      AyahModel.syncIndexes(),
      ReciterModel.syncIndexes(),
      QuranAudioModel.syncIndexes(),
    ]);
    app = createApp(env);

    // Seed Surah Al-Fatiha from AlQuran Cloud (verified source — not invented).
    const arabicRes = await fetch('https://api.alquran.cloud/v1/surah/1/quran-uthmani');
    const uzbekRes = await fetch('https://api.alquran.cloud/v1/surah/1/uz.sodik');
    const arabic = (await arabicRes.json()) as CloudSurahResponse;
    const uzbek = (await uzbekRes.json()) as CloudSurahResponse;

    expect(arabic.code).toBe(200);
    expect(uzbek.code).toBe(200);

    await SurahModel.create({
      number: arabic.data.number,
      nameArabic: arabic.data.name,
      nameLatin: arabic.data.englishName,
      ayahCount: arabic.data.numberOfAyahs,
      revelationType: arabic.data.revelationType.toLowerCase() === 'meccan' ? 'meccan' : 'medinan',
    });

    await AyahModel.insertMany(
      arabic.data.ayahs.map((ayah, index) => ({
        surahNumber: 1,
        ayahNumber: ayah.numberInSurah,
        globalAyahNumber: ayah.number,
        textArabic: ayah.text,
        textUz: uzbek.data.ayahs[index]?.text ?? null,
        translationMeta: {
          translatorName: 'Muhammad Sodik Muhammad Yusuf',
          translationKey: 'uz.sodik',
          rights: {
            licenseStatus: 'licensed',
            licenseNotes: 'AlQuran Cloud uz.sodik',
          },
        },
        sourceMeta: {
          datasetName: 'AlQuran Cloud / quran-uthmani',
          datasetVersion: 'test-surah-1',
          importedAt: new Date(),
          checksum: 'test',
        },
      })),
    );

    const reciter = await ReciterModel.create({
      name: 'Mishary Rashed Alafasy',
      slug: 'mishary-alafasy',
      audioEdition: 'ar.alafasy',
      cdnAyahBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
      cdnSurahBaseUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy',
      rights: {
        licenseStatus: 'licensed',
        licenseNotes: 'cdn.islamic.network',
      },
      isActive: true,
    });
    reciterId = reciter._id.toString();

    await QuranAudioModel.create({
      reciterId: reciter._id,
      scope: 'surah',
      surahNumber: 1,
      audioUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3',
      bitrateKbps: 128,
      rights: {
        licenseStatus: 'licensed',
        licenseNotes: 'cdn.islamic.network',
      },
      isActive: true,
    });
  }, 120_000);

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      QuranProgressModel.deleteMany({}),
      QuranBookmarkModel.deleteMany({}),
    ]);

    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'quran-user@example.com',
      password: 'password123',
      displayName: 'Quran User',
    });
    accessToken = registerRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongo) {
      await mongo.stop();
    }
    resetEnvCache();
  });

  it('lists and searches surahs', async () => {
    const listRes = await request(app).get('/api/v1/quran/surahs');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].number).toBe(1);
    expect(listRes.body.data[0].nameLatin.toLowerCase()).toContain('faat');

    const searchRes = await request(app).get('/api/v1/quran/surahs').query({ q: '1' });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data[0].number).toBe(1);
  });

  it('returns surah detail with verified arabic ayahs', async () => {
    const res = await request(app).get('/api/v1/quran/surahs/1');
    expect(res.status).toBe(200);
    expect(res.body.data.ayahs).toHaveLength(7);
    expect(res.body.data.ayahs[0].textArabic.length).toBeGreaterThan(0);
    expect(res.body.data.ayahs[0].textUz).toBeTruthy();
  });

  it('returns reciter and surah/ayah audio', async () => {
    const recitersRes = await request(app).get('/api/v1/quran/reciters');
    expect(recitersRes.status).toBe(200);
    expect(recitersRes.body.data[0].slug).toBe('mishary-alafasy');

    const surahAudio = await request(app).get('/api/v1/quran/audio').query({
      reciterId,
      surahNumber: 1,
      scope: 'surah',
    });
    expect(surahAudio.status).toBe(200);
    expect(surahAudio.body.data.items[0].audioUrl).toContain('/1.mp3');

    const ayahAudio = await request(app).get('/api/v1/quran/audio').query({
      reciterId,
      surahNumber: 1,
      ayahNumber: 1,
      scope: 'ayah',
    });
    expect(ayahAudio.status).toBe(200);
    expect(ayahAudio.body.data.items[0].audioUrl).toContain('/1.mp3');
  });

  it('persists progress and bookmarks for authenticated user', async () => {
    const progressRes = await request(app)
      .put('/api/v1/quran/progress')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ mode: 'read', surahNumber: 1, ayahNumber: 3 });

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.data.ayahNumber).toBe(3);

    const getProgress = await request(app)
      .get('/api/v1/quran/progress')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(getProgress.body.data[0].surahNumber).toBe(1);

    const bookmarkRes = await request(app)
      .post('/api/v1/quran/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ surahNumber: 1, ayahNumber: 2, note: 'test' });
    expect(bookmarkRes.status).toBe(201);

    const listBookmarks = await request(app)
      .get('/api/v1/quran/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listBookmarks.body.data).toHaveLength(1);

    const deleteRes = await request(app)
      .delete(`/api/v1/quran/bookmarks/${bookmarkRes.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(200);
  });

  it('rejects unauthenticated progress writes', async () => {
    const res = await request(app)
      .put('/api/v1/quran/progress')
      .send({ mode: 'read', surahNumber: 1, ayahNumber: 1 });
    expect(res.status).toBe(401);
  });
});
