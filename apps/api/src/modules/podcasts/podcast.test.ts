import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { PodcastSeriesModel } from './podcastSeries.model.js';
import { PodcastEpisodeModel } from './podcastEpisode.model.js';
import { PodcastProgressModel } from './podcastProgress.model.js';
import { PodcastFavoriteModel } from './podcastFavorite.model.js';

/**
 * EXAMPLE — NOT FOR PRODUCTION
 * In-memory fixtures only to exercise publish gates and public visibility.
 */

describe('podcasts API', () => {
  let mongo: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let editorToken = '';
  let userToken = '';

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
      PodcastSeriesModel.deleteMany({}),
      PodcastEpisodeModel.deleteMany({}),
      PodcastProgressModel.deleteMany({}),
      PodcastFavoriteModel.deleteMany({}),
    ]);

    const editorRes = await request(app).post('/api/v1/auth/register').send({
      email: 'editor@example.com',
      password: 'password123',
      displayName: 'Editor',
    });
    await UserModel.updateOne({ email: 'editor@example.com' }, { role: 'editor' });
    const editorLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'editor@example.com',
      password: 'password123',
    });
    editorToken = editorLogin.body.data.tokens.accessToken;

    const userRes = await request(app).post('/api/v1/auth/register').send({
      email: 'listener@example.com',
      password: 'password123',
      displayName: 'Listener',
    });
    userToken = userRes.body.data.tokens.accessToken;

    void editorRes;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    resetEnvCache();
  });

  it('hides drafts from public and publishes with rights gates', async () => {
    const createSeries = await request(app)
      .post('/api/v1/admin/podcasts/series')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Test Series',
        description: 'Example series for automated tests only.',
        hostOrScholar: 'EXAMPLE Scholar Name',
        coverUrl: 'https://example.com/cover.jpg',
        topics: ['aqidah'],
        rights: { licenseStatus: 'owned', licenseNotes: 'test fixture' },
      });

    expect(createSeries.status).toBe(201);
    const seriesId = createSeries.body.data.id as string;

    const publicBefore = await request(app).get('/api/v1/podcasts/series');
    expect(publicBefore.body.data).toHaveLength(0);

    const rejectUnknown = await request(app)
      .post('/api/v1/admin/podcasts/series')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Bad Rights',
        description: 'Should not publish with unknown rights.',
        hostOrScholar: 'EXAMPLE',
        coverUrl: 'https://example.com/cover2.jpg',
        rights: { licenseStatus: 'unknown' },
      });
    const badId = rejectUnknown.body.data.id as string;
    const publishBad = await request(app)
      .post(`/api/v1/admin/podcasts/series/${badId}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publishBad.status).toBe(422);

    const publishSeries = await request(app)
      .post(`/api/v1/admin/podcasts/series/${seriesId}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publishSeries.status).toBe(200);

    const createEpisode = await request(app)
      .post('/api/v1/admin/podcasts/episodes')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        seriesId,
        title: 'Episode One',
        description: 'Example episode description for tests.',
        audioUrl: 'https://example.com/audio.mp3',
        durationSeconds: 120,
        episodeNumber: 1,
        rights: { licenseStatus: 'owned', licenseNotes: 'test fixture' },
      });
    expect(createEpisode.status).toBe(201);
    const episodeId = createEpisode.body.data.id as string;

    const publishEpisode = await request(app)
      .post(`/api/v1/admin/podcasts/episodes/${episodeId}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publishEpisode.status).toBe(200);

    const publicSeries = await request(app).get('/api/v1/podcasts/series');
    expect(publicSeries.body.data).toHaveLength(1);

    const detail = await request(app).get('/api/v1/podcasts/series/test-series');
    expect(detail.status).toBe(200);
    expect(detail.body.data.episodes).toHaveLength(1);

    const episode = await request(app).get(`/api/v1/podcasts/episodes/${episodeId}`);
    expect(episode.status).toBe(200);
    expect(episode.body.data.audioUrl).toContain('audio.mp3');
  });

  it('tracks progress and favorites for authenticated listeners', async () => {
    const series = await PodcastSeriesModel.create({
      title: 'Live Series',
      slug: 'live-series',
      description: 'Published series fixture.',
      hostOrScholar: 'EXAMPLE Host',
      coverUrl: 'https://example.com/cover.jpg',
      language: 'uz',
      topics: [],
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    const episode = await PodcastEpisodeModel.create({
      seriesId: series._id,
      title: 'Live Episode',
      slug: 'live-episode',
      description: 'Published episode fixture.',
      audioUrl: 'https://example.com/ep.mp3',
      durationSeconds: 300,
      episodeNumber: 1,
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    const progress = await request(app)
      .put('/api/v1/podcasts/progress')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        episodeId: episode._id.toString(),
        positionSeconds: 40,
        durationSeconds: 300,
      });
    expect(progress.status).toBe(200);

    const getProgress = await request(app)
      .get('/api/v1/podcasts/progress')
      .set('Authorization', `Bearer ${userToken}`);
    expect(getProgress.body.data[0].positionSeconds).toBe(40);

    const fav = await request(app)
      .post('/api/v1/podcasts/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'series', targetId: series._id.toString() });
    expect(fav.status).toBe(201);

    const listFav = await request(app)
      .get('/api/v1/podcasts/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listFav.body.data).toHaveLength(1);
  });
});
