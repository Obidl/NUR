import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { BookModel } from './book.model.js';
import { BookChapterModel } from './bookChapter.model.js';
import { BookProgressModel } from './bookProgress.model.js';
import { BookBookmarkModel } from './bookBookmark.model.js';
import { sanitizeChapterBody } from '../../shared/utils/sanitize.js';

/** EXAMPLE — NOT FOR PRODUCTION fixtures */

describe('sanitizeChapterBody', () => {
  it('strips scripts from html', () => {
    const clean = sanitizeChapterBody(
      '<p>Salom</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
      'html',
    );
    expect(clean).toContain('<p>Salom</p>');
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('javascript:');
  });
});

describe('books API', () => {
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
      BookModel.deleteMany({}),
      BookChapterModel.deleteMany({}),
      BookProgressModel.deleteMany({}),
      BookBookmarkModel.deleteMany({}),
    ]);

    await request(app).post('/api/v1/auth/register').send({
      email: 'book-editor@example.com',
      password: 'password123',
      displayName: 'Editor',
    });
    await UserModel.updateOne({ email: 'book-editor@example.com' }, { role: 'editor' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'book-editor@example.com',
      password: 'password123',
    });
    editorToken = login.body.data.tokens.accessToken;

    const user = await request(app).post('/api/v1/auth/register').send({
      email: 'reader@example.com',
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

  it('publishes book/chapter and sanitizes html body', async () => {
    const bookRes = await request(app)
      .post('/api/v1/admin/books')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Example Book',
        authors: ['EXAMPLE Author'],
        description: 'Example book description for tests.',
        coverUrl: 'https://example.com/book.jpg',
        categories: ['fiqh'],
        rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      });
    expect(bookRes.status).toBe(201);
    const bookId = bookRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/admin/books/${bookId}/publish`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    const chapterRes = await request(app)
      .post('/api/v1/admin/books/chapters')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        bookId,
        title: 'Chapter 1',
        order: 1,
        bodyFormat: 'html',
        body: '<p>Assalom</p><script>evil()</script>',
      });
    expect(chapterRes.status).toBe(201);
    const chapterId = chapterRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/admin/books/chapters/${chapterId}/publish`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    const publicList = await request(app).get('/api/v1/books');
    expect(publicList.body.data).toHaveLength(1);

    const chapter = await request(app).get('/api/v1/books/example-book/chapters/chapter-1');
    expect(chapter.status).toBe(200);
    expect(chapter.body.data.chapter.body).toContain('<p>Assalom</p>');
    expect(chapter.body.data.chapter.body).not.toContain('script');
  });

  it('tracks progress and bookmarks', async () => {
    const book = await BookModel.create({
      title: 'Live Book',
      slug: 'live-book',
      authors: ['EXAMPLE'],
      description: 'Published book fixture.',
      coverUrl: 'https://example.com/c.jpg',
      language: 'uz',
      categories: [],
      status: 'published',
      rights: { licenseStatus: 'owned', licenseNotes: 'test' },
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });
    const chapter = await BookChapterModel.create({
      bookId: book._id,
      title: 'One',
      slug: 'one',
      order: 1,
      body: '<p>Text</p>',
      bodyFormat: 'html',
      status: 'published',
      createdBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
    });

    const progress = await request(app)
      .put('/api/v1/books/progress')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookId: book._id.toString(),
        chapterId: chapter._id.toString(),
        position: { scrollRatio: 0.3 },
      });
    expect(progress.status).toBe(200);

    const bookmark = await request(app)
      .post('/api/v1/books/bookmarks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookId: book._id.toString(),
        chapterId: chapter._id.toString(),
      });
    expect(bookmark.status).toBe(201);

    const highlight = await request(app)
      .post('/api/v1/books/highlights')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookId: book._id.toString(),
        chapterId: chapter._id.toString(),
        selectedText: 'Text',
        note: 'Eslatma',
      });
    expect(highlight.status).toBe(201);
    expect(highlight.body.data.selectedText).toBe('Text');

    const listed = await request(app)
      .get(`/api/v1/books/highlights?chapterId=${chapter._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/v1/books/highlights/${highlight.body.data.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ note: 'Yangilandi' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.note).toBe('Yangilandi');

    const deleted = await request(app)
      .delete(`/api/v1/books/highlights/${highlight.body.data.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(deleted.status).toBe(200);
  });
});
