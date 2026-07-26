/**
 * NUR Qur’an import script
 *
 * Provenance:
 * - Arabic text: AlQuran Cloud edition `quran-uthmani`
 *   (Uthmani orthography; distributed via islamic-network / AlQuran Cloud)
 * - Uzbek translation: AlQuran Cloud edition `uz.sodik`
 *   Translator: Muhammad Sodik Muhammad Yusuf
 * - Audio: islamic-network CDN editions `ar.alafasy`, `ar.husary`, `ar.mahermuaiqly`
 *
 * This script never invents Qur’anic text. Re-run replaces reference data
 * in a controlled way and records datasetVersion + checksum.
 *
 * Usage:
 *   cd apps/api && cp .env.example .env  # fill MONGODB_URI
 *   npm run import:quran
 *   npm run upsert:quran-reciters   # optional: extra reciters only
 */

import { createHash } from 'node:crypto';
import 'dotenv/config';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { SurahModel } from '../src/modules/quran/surah.model.js';
import { AyahModel } from '../src/modules/quran/ayah.model.js';
import { ReciterModel } from '../src/modules/quran/reciter.model.js';
import { QuranAudioModel } from '../src/modules/quran/quranAudio.model.js';

const ARABIC_EDITION = 'quran-uthmani';
const UZBEK_EDITION = 'uz.sodik';
const AUDIO_EDITION = 'ar.alafasy';
const DATASET_VERSION = 'alquran-cloud-2026-07-25';
const API_BASE = 'https://api.alquran.cloud/v1';
const CDN_AYAH_BASE = `https://cdn.islamic.network/quran/audio/128/${AUDIO_EDITION}`;
const CDN_SURAH_BASE = `https://cdn.islamic.network/quran/audio-surah/128/${AUDIO_EDITION}`;

type CloudSurah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
};

type CloudQuranResponse = {
  code: number;
  data: {
    surahs: CloudSurah[];
    edition: { identifier: string; englishName: string; name: string };
  };
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

function checksum(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

async function main() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);
  console.info('[import:quran] connected');

  console.info(`[import:quran] fetching ${ARABIC_EDITION}…`);
  const arabic = await fetchJson<CloudQuranResponse>(`${API_BASE}/quran/${ARABIC_EDITION}`);
  console.info(`[import:quran] fetching ${UZBEK_EDITION}…`);
  const uzbek = await fetchJson<CloudQuranResponse>(`${API_BASE}/quran/${UZBEK_EDITION}`);

  if (arabic.code !== 200 || uzbek.code !== 200) {
    throw new Error('AlQuran Cloud returned a non-OK status');
  }

  if (arabic.data.surahs.length !== 114 || uzbek.data.surahs.length !== 114) {
    throw new Error('Expected 114 surahs from both editions');
  }

  const arabicPayload = JSON.stringify(arabic.data.surahs);
  const textChecksum = checksum(arabicPayload);
  const importedAt = new Date();

  function stripBom(text: string) {
    return text.replace(/^\uFEFF/, '');
  }

  const surahDocs = arabic.data.surahs.map((surah) => ({
    number: surah.number,
    nameArabic: stripBom(surah.name),
    nameLatin: surah.englishName,
    nameUz: null,
    ayahCount: surah.numberOfAyahs ?? surah.ayahs.length,
    revelationType: surah.revelationType.toLowerCase() === 'meccan' ? 'meccan' : 'medinan',
  }));

  const ayahDocs = [];
  for (let i = 0; i < arabic.data.surahs.length; i += 1) {
    const arabicSurah = arabic.data.surahs[i];
    const uzbekSurah = uzbek.data.surahs[i];

    if (arabicSurah.number !== uzbekSurah.number) {
      throw new Error(`Surah number mismatch at index ${i}`);
    }
    if (arabicSurah.ayahs.length !== uzbekSurah.ayahs.length) {
      throw new Error(`Ayah count mismatch for surah ${arabicSurah.number}`);
    }

    for (let j = 0; j < arabicSurah.ayahs.length; j += 1) {
      const arabicAyah = arabicSurah.ayahs[j];
      const uzbekAyah = uzbekSurah.ayahs[j];

      ayahDocs.push({
        surahNumber: arabicSurah.number,
        ayahNumber: arabicAyah.numberInSurah,
        globalAyahNumber: arabicAyah.number,
        textArabic: stripBom(arabicAyah.text),
        textUz: stripBom(uzbekAyah.text),
        translationMeta: {
          translatorName: uzbek.data.edition.englishName || 'Muhammad Sodik Muhammad Yusuf',
          translationKey: UZBEK_EDITION,
          rights: {
            licenseStatus: 'licensed' as const,
            licenseNotes:
              'Imported from AlQuran Cloud edition uz.sodik. Verify redistribution rights for your deployment jurisdiction.',
          },
        },
        sourceMeta: {
          datasetName: `AlQuran Cloud / ${ARABIC_EDITION}`,
          datasetVersion: DATASET_VERSION,
          importedAt,
          checksum: textChecksum,
        },
      });
    }
  }

  if (ayahDocs.length !== 6236) {
    throw new Error(`Expected 6236 ayahs, got ${ayahDocs.length}`);
  }

  console.info('[import:quran] replacing surahs + ayahs…');
  await AyahModel.deleteMany({});
  await SurahModel.deleteMany({});
  await SurahModel.insertMany(surahDocs);
  await AyahModel.insertMany(ayahDocs, { ordered: false });

  console.info('[import:quran] upserting default reciter + surah audio…');
  // Keep single default reciter here; run `npm run upsert:quran-reciters` for more.
  const reciter = await ReciterModel.findOneAndUpdate(
    { slug: 'mishary-alafasy' },
    {
      name: 'Mishary Rashed Alafasy',
      slug: 'mishary-alafasy',
      bio: 'Qur’an reciter (AlQuran Cloud / islamic-network audio edition ar.alafasy).',
      audioEdition: AUDIO_EDITION,
      cdnAyahBaseUrl: CDN_AYAH_BASE,
      cdnSurahBaseUrl: CDN_SURAH_BASE,
      rights: {
        licenseStatus: 'licensed',
        licenseNotes:
          'Audio streamed from cdn.islamic.network edition ar.alafasy. Confirm CDN usage terms for production.',
      },
      isActive: true,
    },
    { upsert: true, new: true },
  );

  await QuranAudioModel.deleteMany({ reciterId: reciter._id, scope: 'surah' });
  const audioDocs = surahDocs.map((surah) => ({
    reciterId: reciter._id,
    scope: 'surah' as const,
    surahNumber: surah.number,
    ayahNumber: null,
    audioUrl: `${CDN_SURAH_BASE}/${surah.number}.mp3`,
    bitrateKbps: 128,
    rights: {
      licenseStatus: 'licensed' as const,
      licenseNotes: 'cdn.islamic.network surah audio for ar.alafasy',
    },
    isActive: true,
  }));
  await QuranAudioModel.insertMany(audioDocs);

  console.info('[import:quran] done', {
    surahs: surahDocs.length,
    ayahs: ayahDocs.length,
    checksum: textChecksum,
    datasetVersion: DATASET_VERSION,
    reciter: reciter.slug,
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[import:quran] failed', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
