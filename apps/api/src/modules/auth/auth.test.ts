import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../../config/env.js';
import { createApp } from '../../app.js';
import { UserModel } from './user.model.js';
import { RefreshTokenModel } from './refreshToken.model.js';
import { PasswordResetTokenModel } from './passwordResetToken.model.js';
import { registerBodySchema } from './auth.validation.js';

describe('auth validation', () => {
  it('rejects short passwords', () => {
    const result = registerBodySchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      displayName: 'User',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid register payload', () => {
    const result = registerBodySchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      displayName: 'Husanboy',
    });
    expect(result.success).toBe(true);
  });
});

describe('auth API', () => {
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
      UserModel.deleteMany({}),
      RefreshTokenModel.deleteMany({}),
      PasswordResetTokenModel.deleteMany({}),
    ]);
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

  it('registers, fetches me, refreshes, and logs out', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'husanboy@example.com',
      password: 'password123',
      displayName: 'Husanboy',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.user.email).toBe('husanboy@example.com');
    expect(registerRes.body.data.tokens.accessToken).toBeTruthy();
    expect(registerRes.body.data.tokens.refreshToken).toBeTruthy();

    const accessToken = registerRes.body.data.tokens.accessToken as string;
    const refreshToken = registerRes.body.data.tokens.refreshToken as string;

    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.displayName).toBe('Husanboy');
    expect(meRes.body.data.passwordHash).toBeUndefined();

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens.accessToken).toBeTruthy();
    expect(refreshRes.body.data.tokens.refreshToken).not.toBe(refreshToken);

    const newRefresh = refreshRes.body.data.tokens.refreshToken as string;
    const newAccess = refreshRes.body.data.tokens.accessToken as string;

    const reuseRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(reuseRes.status).toBe(401);

    // Family revoke: rotated refresh must also be dead after reuse detection.
    const reuseNew = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: newRefresh });
    expect(reuseNew.status).toBe(401);

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${newAccess}`)
      .send({ refreshToken: newRefresh });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.success).toBe(true);
  });

  it('rejects duplicate email registration', async () => {
    const payload = {
      email: 'dup@example.com',
      password: 'password123',
      displayName: 'One',
    };

    await request(app).post('/api/v1/auth/register').send(payload);
    const second = await request(app).post('/api/v1/auth/register').send(payload);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
  });

  it('logs in with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@example.com',
      password: 'password123',
      displayName: 'Login User',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe('login@example.com');
  });

  it('rejects invalid login', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'missing@example.com',
      password: 'password123',
    });

    expect(loginRes.status).toBe(401);
  });

  it('resets password via request/confirm without email enumeration', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'reset@example.com',
      password: 'password123',
      displayName: 'Reset User',
    });

    const unknown = await request(app)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'nobody@example.com' });
    expect(unknown.status).toBe(200);
    expect(unknown.body.data.devResetToken).toBeUndefined();

    const requestRes = await request(app)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'reset@example.com' });
    expect(requestRes.status).toBe(200);
    expect(requestRes.body.data.devResetToken).toBeTruthy();

    const token = requestRes.body.data.devResetToken as string;
    const confirm = await request(app)
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token, newPassword: 'newpassword99' });
    expect(confirm.status).toBe(200);

    const oldLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'reset@example.com',
      password: 'password123',
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'reset@example.com',
      password: 'newpassword99',
    });
    expect(newLogin.status).toBe(200);
  });
});
