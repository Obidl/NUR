import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from '../auth/user.model.js';
import { ResearchArticleModel } from '../research/research.model.js';

/** EXAMPLE — NOT FOR PRODUCTION fixtures */

describe('admin users + soft delete', () => {
  let mongo: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let adminToken = '';
  let editorToken = '';
  let adminId = '';

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
    await Promise.all([UserModel.deleteMany({}), ResearchArticleModel.deleteMany({})]);

    const adminReg = await request(app).post('/api/v1/auth/register').send({
      email: 'admin@example.com',
      password: 'password123',
      displayName: 'Admin',
    });
    adminId = adminReg.body.data.user.id;
    await UserModel.updateOne({ email: 'admin@example.com' }, { role: 'admin' });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    adminToken = adminLogin.body.data.tokens.accessToken;

    await request(app).post('/api/v1/auth/register').send({
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
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    resetEnvCache();
  });

  it('lists users and updates roles for admin only', async () => {
    const forbidden = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${editorToken}`);
    expect(forbidden.status).toBe(403);

    const list = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(2);

    const editor = list.body.data.find((u: { email: string }) => u.email === 'editor@example.com');
    const roleRes = await request(app)
      .patch(`/api/v1/admin/users/${editor.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.role).toBe('user');
  });

  it('deactivates user and blocks login', async () => {
    const list = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const editor = list.body.data.find((u: { email: string }) => u.email === 'editor@example.com');

    await request(app)
      .patch(`/api/v1/admin/users/${editor.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'editor@example.com',
      password: 'password123',
    });
    expect(login.status).toBe(401);

    const self = await request(app)
      .patch(`/api/v1/admin/users/${adminId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(self.status).toBe(422);
  });

  it('soft-deletes research and hides from public + admin lists', async () => {
    const created = await request(app)
      .post('/api/v1/admin/research')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Soft Delete Article',
        summary: 'Example summary for soft delete test.',
        body: '<p>Body</p>',
        category: 'fiqh',
        authors: ['EXAMPLE'],
        sources: [{ title: 'Book', type: 'book', citation: 'EXAMPLE' }],
        rights: { licenseStatus: 'owned' },
      });
    const id = created.body.data.id as string;

    await request(app)
      .patch(`/api/v1/admin/research/${id}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        sources: [{ title: 'Book', type: 'book', citation: 'EXAMPLE' }],
        rights: { licenseStatus: 'owned' },
      });

    await request(app)
      .post(`/api/v1/admin/research/${id}/status`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'in_review' })
      .expect(200);

    await request(app)
      .post(`/api/v1/admin/research/${id}/publish`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    expect((await request(app).get('/api/v1/research')).body.data).toHaveLength(1);

    await request(app)
      .delete(`/api/v1/admin/research/${id}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    expect((await request(app).get('/api/v1/research')).body.data).toHaveLength(0);
    const adminList = await request(app)
      .get('/api/v1/admin/research')
      .set('Authorization', `Bearer ${editorToken}`);
    expect(adminList.body.data).toHaveLength(0);

    const row = await ResearchArticleModel.findById(id).lean();
    expect(row?.deletedAt).toBeTruthy();
    expect(row?.status).toBe('archived');
  });
});
