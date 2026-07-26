/**
 * Upsert licensed Qur’an reciters (CDN editions) without re-importing mushaf text.
 *
 * Provenance: islamic-network / AlQuran Cloud audio editions.
 * Usage: cd apps/api && npm run upsert:quran-reciters
 * Refuses when NODE_ENV=production.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { ReciterModel } from '../src/modules/quran/reciter.model.js';
import { QuranAudioModel } from '../src/modules/quran/quranAudio.model.js';

const RECITERS = [
  {
    name: 'Mishary Rashed Alafasy',
    slug: 'mishary-alafasy',
    bio: 'Qur’an reciter (islamic-network audio edition ar.alafasy).',
    audioEdition: 'ar.alafasy',
  },
  {
    name: 'Mahmoud Khalil Al-Husary',
    slug: 'mahmoud-husary',
    bio: 'Qur’an reciter (islamic-network audio edition ar.husary).',
    audioEdition: 'ar.husary',
  },
  {
    name: 'Maher Al Muaiqly',
    slug: 'maher-al-muaiqly',
    bio: 'Qur’an reciter (islamic-network audio edition ar.mahermuaiqly).',
    audioEdition: 'ar.mahermuaiqly',
  },
] as const;

async function upsertReciter(def: (typeof RECITERS)[number]) {
  const cdnAyahBaseUrl = `https://cdn.islamic.network/quran/audio/128/${def.audioEdition}`;
  const cdnSurahBaseUrl = `https://cdn.islamic.network/quran/audio-surah/128/${def.audioEdition}`;

  const reciter = await ReciterModel.findOneAndUpdate(
    { slug: def.slug },
    {
      name: def.name,
      slug: def.slug,
      bio: def.bio,
      audioEdition: def.audioEdition,
      cdnAyahBaseUrl,
      cdnSurahBaseUrl,
      rights: {
        licenseStatus: 'licensed',
        licenseNotes: `Audio streamed from cdn.islamic.network edition ${def.audioEdition}. Confirm CDN usage terms for production.`,
      },
      isActive: true,
    },
    { upsert: true, new: true },
  );

  await QuranAudioModel.deleteMany({ reciterId: reciter._id, scope: 'surah' });
  const audioDocs = Array.from({ length: 114 }, (_, i) => {
    const surahNumber = i + 1;
    return {
      reciterId: reciter._id,
      scope: 'surah' as const,
      surahNumber,
      ayahNumber: null,
      audioUrl: `${cdnSurahBaseUrl}/${surahNumber}.mp3`,
      bitrateKbps: 128,
      rights: {
        licenseStatus: 'licensed' as const,
        licenseNotes: `cdn.islamic.network surah audio for ${def.audioEdition}`,
      },
      isActive: true,
    };
  });
  await QuranAudioModel.insertMany(audioDocs);

  return reciter.slug;
}

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing upsert when NODE_ENV=production');
  }

  await mongoose.connect(env.MONGODB_URI);
  console.info('[upsert:quran-reciters] connected');

  const slugs = [];
  for (const def of RECITERS) {
    const slug = await upsertReciter(def);
    slugs.push(slug);
    console.info('[upsert:quran-reciters] upserted', slug);
  }

  console.info('[upsert:quran-reciters] done', { reciters: slugs });
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[upsert:quran-reciters] failed', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
