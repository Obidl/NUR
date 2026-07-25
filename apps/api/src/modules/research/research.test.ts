import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { ResearchArticleModel } from './research.model.js';
import { ResearchBookmarkModel } from './researchBookmark.model.js';

/** EXAMPLE — NOT FOR PRODUCTION fixtures */

describe('research API', () => {
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
      ResearchArticleModel.deleteMany({}),
      ResearchBookmarkModel.deleteMany({}),
    ]);

    await request(app).post('/api/v1/auth/register').send({
      email: 'research-editor@example.com',
      password: 'password123',
      displayName: 'Editor',
    });
    await UserModel.updateOne({ email: 'research-editor@example.com' }, { role: 'editor' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'research-editor@example.com',
      password: 'password123',
    });
    editorToken = login.body.data.tokens.accessToken;

    const user = await request(app).post('/api/v1/auth/register').send({
      email: 'research-reader@example.com',
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

  it('hides drafts and publishes only with sources + rights', async () => {
    const createRes = await request(app)
      .post('/api/v1/admin/research')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Example Research',
        summary: 'Example summary for tests only.',
        body: '<p>Body</p><script>evil()</script>',
        bodyFormat: 'html',
        category: 'aqidah',
        authors: ['EXAMPLE Scholar'],
        sources: [],
        rights: { licenseStatus: 'unknown' },
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.id as string;

    const publicBefore = await request(app).get('/api/v1/research');
    expect(publicBefore.body.data).toHaveLength(0);

    const failUnknown = await request(app)
      .post(`/api/v1/admin/research/${id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(failUnknown.status).toBe(422);

    await request(app)
      .patch(`/api/v1/admin/research/${id}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        rights: { licenseStatus: 'owned', licenseNotes: 'test owned' },
        sources: [
          {
            title: 'EXAMPLE Source Book',
            type: 'book',
            citation: 'Author, Title, p. 1 — EXAMPLE NOT FOR PRODUCTION',
          },
        ],
      })
      .expect(200);

    const published = await request(app)
      .post(`/api/v1/admin/research/${id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(published.status).toBe(200);

    const list = await request(app).get('/api/v1/research');
    expect(list.body.data).toHaveLength(1);

    const detail = await request(app).get('/api/v1/research/example-research');
    expect(detail.status).toBe(200);
    expect(detail.body.data.article.sources).toHaveLength(1);
    expect(detail.body.data.article.body).toContain('<p>Body</p>');
    expect(detail.body.data.article.body).not.toContain('script');
    expect(detail.body.data.related).toEqual([]);
  });

  it('rejects AI-named sources on publish', async () => {
    const createRes = await request(app)
      .post('/api/v1/admin/research')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'AI Source Test',
        summary: 'Example summary for tests only.',
        body: '<p>Body</p>',
        category: 'fiqh',
        authors: ['EXAMPLE'],
        sources: [
          {
            title: 'ChatGPT',
            type: 'other',
            citation: 'Asked ChatGPT about the topic',
          },
        ],
        rights: { licenseStatus: 'owned' },
      });
    expect(createRes.status).toBe(201);

    const publish = await request(app)
      .post(`/api/v1/admin/research/${createRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`);
    expect(publish.status).toBe(422);
  });

  it('supports bookmarks for published articles', async () => {
    const article = await ResearchArticleModel.create({
      title: 'Live Article',
      slug: 'live-article',
      summary: 'Published fixture summary.',
      body: '<p>Text</p>',
      bodyFormat: 'html',
      category: 'tafsir',
      tags: ['quran'],
      authors: ['EXAMPLE'],
      sources: [
        {
          title: 'Qur’an',
          type: 'quran',
          citation: 'Surah example — NOT FOR PRODUCTION',
        },
      ],
      language: 'uz',
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    const bookmark = await request(app)
      .post('/api/v1/research/bookmarks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ articleId: article._id.toString() });
    expect(bookmark.status).toBe(201);

    const list = await request(app)
      .get('/api/v1/research/bookmarks')
      .set('Authorization', `Bearer ${userToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('returns related articles by category and tags', async () => {
    const base = {
      body: '<p>Text</p>',
      bodyFormat: 'html' as const,
      authors: ['EXAMPLE'],
      sources: [
        {
          title: 'Qur’an',
          type: 'quran' as const,
          citation: 'Surah example — NOT FOR PRODUCTION',
        },
      ],
      language: 'uz',
      status: 'published' as const,
      rights: { licenseStatus: 'owned' as const, licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    };

    await ResearchArticleModel.create([
      {
        ...base,
        title: 'Main Article',
        slug: 'main-article',
        summary: 'Main summary.',
        category: 'tafsir',
        tags: ['quran', 'nur'],
      },
      {
        ...base,
        title: 'Same Category',
        slug: 'same-category',
        summary: 'Same category summary.',
        category: 'tafsir',
        tags: ['other'],
        publishedAt: new Date(Date.now() - 1000),
      },
      {
        ...base,
        title: 'Shared Tag',
        slug: 'shared-tag',
        summary: 'Shared tag summary.',
        category: 'fiqh',
        tags: ['quran'],
        publishedAt: new Date(Date.now() - 2000),
      },
      {
        ...base,
        title: 'Unrelated',
        slug: 'unrelated',
        summary: 'Unrelated summary.',
        category: 'aqidah',
        tags: ['history'],
        publishedAt: new Date(Date.now() - 3000),
      },
      {
        ...base,
        title: 'Draft Sibling',
        slug: 'draft-sibling',
        summary: 'Draft should be hidden.',
        category: 'tafsir',
        tags: ['quran'],
        status: 'draft',
        publishedAt: null,
      },
    ]);

    const detail = await request(app).get('/api/v1/research/main-article');
    expect(detail.status).toBe(200);
    const relatedSlugs = detail.body.data.related.map((row: { slug: string }) => row.slug);
    expect(relatedSlugs).toContain('same-category');
    expect(relatedSlugs).toContain('shared-tag');
    expect(relatedSlugs).not.toContain('unrelated');
    expect(relatedSlugs).not.toContain('draft-sibling');
    expect(relatedSlugs).not.toContain('main-article');
  });
});
