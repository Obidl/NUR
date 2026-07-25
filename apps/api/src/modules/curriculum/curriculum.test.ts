import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { LearningPathModel } from './curriculum.model.js';
import { PathProgressModel } from './pathProgress.model.js';
import { ResearchArticleModel } from '../research/research.model.js';
import { SurahModel } from '../quran/surah.model.js';
import { AyahModel } from '../quran/ayah.model.js';

/** EXAMPLE — NOT FOR PRODUCTION fixtures */

describe('curriculum API', () => {
  let mongo: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let editorToken = '';
  let userToken = '';
  let editorUserId = '';

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
      LearningPathModel.deleteMany({}),
      PathProgressModel.deleteMany({}),
      ResearchArticleModel.deleteMany({}),
      SurahModel.deleteMany({}),
      AyahModel.deleteMany({}),
    ]);

    await request(app).post('/api/v1/auth/register').send({
      email: 'curriculum-editor@example.com',
      password: 'password123',
      displayName: 'Editor',
    });
    const editor = await UserModel.findOne({ email: 'curriculum-editor@example.com' }).lean();
    editorUserId = editor!._id.toString();
    await UserModel.updateOne({ email: 'curriculum-editor@example.com' }, { role: 'editor' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'curriculum-editor@example.com',
      password: 'password123',
    });
    editorToken = login.body.data.tokens.accessToken;

    const user = await request(app).post('/api/v1/auth/register').send({
      email: 'curriculum-reader@example.com',
      password: 'password123',
      displayName: 'Reader',
    });
    userToken = user.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    resetEnvCache();
  });

  async function createExampleResearchArticle() {
    return ResearchArticleModel.create({
      title: 'EXAMPLE Curriculum Article',
      slug: 'example-curriculum-article',
      summary: 'EXAMPLE summary for curriculum tests only.',
      body: '<p>EXAMPLE body</p>',
      bodyFormat: 'html',
      category: 'aqidah',
      tags: ['example'],
      authors: ['EXAMPLE Editor'],
      sources: [
        {
          title: 'EXAMPLE Source',
          type: 'book',
          citation: 'Author, Title — EXAMPLE NOT FOR PRODUCTION',
        },
      ],
      language: 'uz',
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(editorUserId),
      publishedAt: new Date(),
    });
  }

  async function seedExampleQuranRange() {
    await SurahModel.create({
      number: 1,
      nameArabic: 'EXAMPLE',
      nameLatin: 'Al-Fatiha',
      nameUz: 'EXAMPLE',
      ayahCount: 7,
      revelationType: 'meccan',
    });
    await AyahModel.create({
      surahNumber: 1,
      ayahNumber: 1,
      textArabic: 'EXAMPLE — NOT FOR PRODUCTION',
      textUz: 'EXAMPLE translation — NOT FOR PRODUCTION',
      globalAyahNumber: 1,
      sourceMeta: {
        datasetName: 'EXAMPLE',
        datasetVersion: 'test',
        importedAt: new Date(),
      },
    });
  }

  function examplePathPayload(articleId: string) {
    return {
      title: 'EXAMPLE Learning Path',
      summary: 'EXAMPLE curriculum path for tests only.',
      authors: ['EXAMPLE Editor'],
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      modules: [
        {
          title: 'Module One',
          order: 1,
          summary: 'EXAMPLE module summary.',
          lessons: [
            {
              title: 'Research Lesson',
              order: 1,
              targetType: 'research_article',
              targetRef: { articleId },
            },
          ],
        },
      ],
    };
  }

  it('hides drafts from public list', async () => {
    const article = await createExampleResearchArticle();

    const createRes = await request(app)
      .post('/api/v1/admin/curriculum')
      .set('Authorization', `Bearer ${editorToken}`)
      .send(examplePathPayload(article._id.toString()));
    expect(createRes.status).toBe(201);

    const publicList = await request(app).get('/api/v1/curriculum/paths');
    expect(publicList.status).toBe(200);
    expect(publicList.body.data).toHaveLength(0);
  });

  it('publish fails if lesson points to missing or unpublished target', async () => {
    const createRes = await request(app)
      .post('/api/v1/admin/curriculum')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Broken Path',
        summary: 'EXAMPLE path with invalid lesson target.',
        authors: ['EXAMPLE Editor'],
        rights: { licenseStatus: 'owned' },
        modules: [
          {
            title: 'Module One',
            order: 1,
            lessons: [
              {
                title: 'Missing Article',
                order: 1,
                targetType: 'research_article',
                targetRef: { articleId: new mongoose.Types.ObjectId().toString() },
              },
            ],
          },
        ],
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.id as string;

    const publish = await request(app)
      .post(`/api/v1/admin/curriculum/${id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publish.status).toBe(422);

    const draftArticle = await ResearchArticleModel.create({
      title: 'Draft Article',
      slug: 'draft-curriculum-article',
      summary: 'Draft should block publish.',
      body: '<p>Body</p>',
      bodyFormat: 'html',
      category: 'fiqh',
      authors: ['EXAMPLE'],
      sources: [
        {
          title: 'EXAMPLE Source',
          type: 'book',
          citation: 'EXAMPLE NOT FOR PRODUCTION',
        },
      ],
      language: 'uz',
      status: 'draft',
      rights: { licenseStatus: 'owned' },
      createdBy: new mongoose.Types.ObjectId(editorUserId),
    });

    await request(app)
      .patch(`/api/v1/admin/curriculum/${id}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        modules: [
          {
            title: 'Module One',
            order: 1,
            lessons: [
              {
                title: 'Draft Article Lesson',
                order: 1,
                targetType: 'research_article',
                targetRef: { articleId: draftArticle._id.toString() },
              },
            ],
          },
        ],
      })
      .expect(200);

    const publishDraft = await request(app)
      .post(`/api/v1/admin/curriculum/${id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publishDraft.status).toBe(422);
  });

  it('publish succeeds when targets exist', async () => {
    const article = await createExampleResearchArticle();

    const createRes = await request(app)
      .post('/api/v1/admin/curriculum')
      .set('Authorization', `Bearer ${editorToken}`)
      .send(examplePathPayload(article._id.toString()));
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.id as string;

    const publish = await request(app)
      .post(`/api/v1/admin/curriculum/${id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publish.status).toBe(200);

    const publicList = await request(app).get('/api/v1/curriculum/paths');
    expect(publicList.body.data).toHaveLength(1);

    const detail = await request(app).get('/api/v1/curriculum/paths/example-learning-path');
    expect(detail.status).toBe(200);
    expect(detail.body.data.path.modules[0].lessons[0].targetLabel).toBe('EXAMPLE Curriculum Article');
    expect(detail.body.data.path.modules[0].lessons[0].targetSlug).toBe('example-curriculum-article');
  });

  it('publish succeeds for quran_range when ayahs exist', async () => {
    await seedExampleQuranRange();

    const createRes = await request(app)
      .post('/api/v1/admin/curriculum')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Quran Path',
        summary: 'EXAMPLE quran curriculum path for tests only.',
        authors: ['EXAMPLE Editor'],
        rights: { licenseStatus: 'owned' },
        modules: [
          {
            title: 'Quran Module',
            order: 1,
            lessons: [
              {
                title: 'Al-Fatiha ayah 1',
                order: 1,
                targetType: 'quran_range',
                targetRef: { surahNumber: 1, ayahFrom: 1, ayahTo: 1 },
              },
            ],
          },
        ],
      });
    expect(createRes.status).toBe(201);

    const publish = await request(app)
      .post(`/api/v1/admin/curriculum/${createRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publish.status).toBe(200);
  });

  it('upserts progress for authenticated user', async () => {
    const article = await createExampleResearchArticle();

    const createRes = await request(app)
      .post('/api/v1/admin/curriculum')
      .set('Authorization', `Bearer ${editorToken}`)
      .send(examplePathPayload(article._id.toString()));
    const pathId = createRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/admin/curriculum/${pathId}/publish`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    const path = await LearningPathModel.findById(pathId).lean();
    const lessonId = path!.modules[0].lessons[0]._id.toString();

    const upsert = await request(app)
      .put('/api/v1/curriculum/progress')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pathId, completeLessonId: lessonId });
    expect(upsert.status).toBe(200);
    expect(upsert.body.data.completedLessonIds).toContain(lessonId);
    expect(upsert.body.data.currentLessonId).toBe(lessonId);

    const list = await request(app)
      .get('/api/v1/curriculum/progress')
      .set('Authorization', `Bearer ${userToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].path.slug).toBe('example-learning-path');
  });
});
