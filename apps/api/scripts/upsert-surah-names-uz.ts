/**
 * Fill Surah.nameUz from uz.wikipedia Latin list (metadata only — not ayah text).
 *
 * Source: https://uz.wikipedia.org/wiki/Qurʼondagi_suralar_roʻyxati
 * Names stored without the trailing «surasi» word for compact UI.
 *
 * Usage: cd apps/api && npm run upsert:surah-names-uz
 * Refuses when NODE_ENV=production.
 */

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { SurahModel } from '../src/modules/quran/surah.model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAMES_PATH = join(__dirname, 'data', 'surah-names-uz.json');

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing upsert when NODE_ENV=production');
  }

  const names = JSON.parse(readFileSync(NAMES_PATH, 'utf8')) as string[];
  if (names.length !== 114) {
    throw new Error(`Expected 114 names, got ${names.length}`);
  }

  await mongoose.connect(env.MONGODB_URI);
  console.info('[upsert:surah-names-uz] connected');

  let updated = 0;
  for (let i = 0; i < names.length; i += 1) {
    const number = i + 1;
    const nameUz = names[i]!;
    const result = await SurahModel.updateOne({ number }, { $set: { nameUz } });
    if (result.modifiedCount > 0 || result.matchedCount > 0) updated += 1;
  }

  const sample = await SurahModel.find({ number: { $in: [1, 67, 114] } })
    .select('number nameLatin nameUz')
    .lean();
  console.info('[upsert:surah-names-uz] done', { updated, sample });
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[upsert:surah-names-uz] failed', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
