/**
 * Upsert a user and set role (admin/editor/user).
 * Credentials ONLY via env — never hardcode passwords in the repo.
 *
 * Usage:
 *   cd apps/api
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... ADMIN_ROLE=admin \
 *     NODE_ENV=development npx tsx scripts/upsert-admin.ts
 *
 * Refuses when NODE_ENV=production.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { UserModel } from '../src/modules/auth/user.model.js';

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing upsert-admin when NODE_ENV=production');
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_NAME?.trim() || 'Admin';
  const role = (process.env.ADMIN_ROLE?.trim() || 'admin') as 'user' | 'editor' | 'admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }
  if (!['user', 'editor', 'admin'].includes(role)) {
    throw new Error('ADMIN_ROLE must be user|editor|admin');
  }

  await mongoose.connect(env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await UserModel.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      displayName,
      role,
      isActive: true,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  console.info('[upsert-admin] ok', {
    id: String(user!._id),
    email: user!.email,
    displayName: user!.displayName,
    role: user!.role,
  });

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('[upsert-admin] failed', error);
  process.exitCode = 1;
});
