import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { SurahModel } from './surah.model.js';
import { AyahModel } from './ayah.model.js';
import { ReciterModel } from './reciter.model.js';
import { QuranAudioModel } from './quranAudio.model.js';
import { QuranProgressModel } from './quranProgress.model.js';
import { QuranBookmarkModel } from './quranBookmark.model.js';
import type { CreateBookmarkBody, UpsertProgressBody } from './quran.validation.js';

/** Strip UTF-8 BOM that some mushaf editions prepend (e.g. Fatiha 1). */
function cleanArabicText(text: string) {
  return text.replace(/^\uFEFF+/, '');
}

function toSurahDto(surah: {
  number: number;
  nameArabic: string;
  nameLatin: string;
  nameUz?: string | null;
  ayahCount: number;
  revelationType: string;
}) {
  return {
    number: surah.number,
    nameArabic: cleanArabicText(surah.nameArabic),
    nameLatin: surah.nameLatin,
    nameUz: surah.nameUz ?? null,
    ayahCount: surah.ayahCount,
    revelationType: surah.revelationType,
  };
}

export async function listSurahs(q?: string) {
  if (!q) {
    const surahs = await SurahModel.find().sort({ number: 1 }).lean();
    return surahs.map(toSurahDto);
  }

  const trimmed = q.trim();
  const asNumber = Number(trimmed);

  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 114) {
    const surah = await SurahModel.findOne({ number: asNumber }).lean();
    return surah ? [toSurahDto(surah)] : [];
  }

  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const surahs = await SurahModel.find({
    $or: [{ nameLatin: regex }, { nameArabic: regex }, { nameUz: regex }],
  })
    .sort({ number: 1 })
    .lean();

  return surahs.map(toSurahDto);
}

export async function getSurahWithAyahs(surahNumber: number) {
  const surah = await SurahModel.findOne({ number: surahNumber }).lean();
  if (!surah) {
    throw new AppError('NOT_FOUND', 'Surah not found', 404);
  }

  const ayahs = await AyahModel.find({ surahNumber })
    .sort({ ayahNumber: 1 })
    .select('surahNumber ayahNumber textArabic textUz translationMeta')
    .lean();

  return {
    surah: toSurahDto(surah),
    ayahs: ayahs.map((ayah) => ({
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      textArabic: cleanArabicText(ayah.textArabic),
      textUz: ayah.textUz ?? null,
      translation: ayah.translationMeta
        ? {
            translatorName: ayah.translationMeta.translatorName,
            translationKey: ayah.translationMeta.translationKey,
          }
        : null,
    })),
  };
}

export async function searchAyahs(q: string, limit: number) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  try {
    const textHits = await AyahModel.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('surahNumber ayahNumber textArabic textUz')
      .lean();

    if (textHits.length > 0) {
      return textHits.map((ayah) => ({
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        textArabic: cleanArabicText(ayah.textArabic),
        textUz: ayah.textUz ?? null,
      }));
    }
  } catch {
    // Fall back to regex if text index is unavailable.
  }

  const ayahs = await AyahModel.find({
    $or: [{ textArabic: regex }, { textUz: regex }],
  })
    .limit(limit)
    .select('surahNumber ayahNumber textArabic textUz')
    .lean();

  return ayahs.map((ayah) => ({
    surahNumber: ayah.surahNumber,
    ayahNumber: ayah.ayahNumber,
    textArabic: cleanArabicText(ayah.textArabic),
    textUz: ayah.textUz ?? null,
  }));
}

export async function listReciters() {
  const reciters = await ReciterModel.find({ isActive: true }).sort({ name: 1 }).lean();
  return reciters.map((reciter) => ({
    id: reciter._id.toString(),
    name: reciter.name,
    slug: reciter.slug,
    bio: reciter.bio ?? null,
    photoUrl: reciter.photoUrl ?? null,
    audioEdition: reciter.audioEdition,
    rights: {
      licenseStatus: reciter.rights.licenseStatus,
      licenseNotes: reciter.rights.licenseNotes ?? null,
    },
  }));
}

export async function listAudio(input: {
  reciterId: string;
  surahNumber: number;
  ayahNumber?: number;
  scope?: 'ayah' | 'surah';
}) {
  if (!Types.ObjectId.isValid(input.reciterId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid reciterId', 422);
  }

  const reciter = await ReciterModel.findOne({
    _id: input.reciterId,
    isActive: true,
  }).lean();

  if (!reciter) {
    throw new AppError('NOT_FOUND', 'Reciter not found', 404);
  }

  const scope =
    input.scope ?? (input.ayahNumber !== undefined ? 'ayah' : 'surah');

  if (scope === 'surah') {
    const audio = await QuranAudioModel.findOne({
      reciterId: reciter._id,
      scope: 'surah',
      surahNumber: input.surahNumber,
      isActive: true,
    }).lean();

    if (!audio) {
      throw new AppError('NOT_FOUND', 'Surah audio not found', 404);
    }

    return {
      items: [
        {
          id: audio._id.toString(),
          scope: 'surah' as const,
          surahNumber: audio.surahNumber,
          ayahNumber: null,
          audioUrl: audio.audioUrl,
          bitrateKbps: audio.bitrateKbps ?? null,
          rights: audio.rights,
          reciter: {
            id: reciter._id.toString(),
            name: reciter.name,
            slug: reciter.slug,
          },
        },
      ],
    };
  }

  if (input.ayahNumber === undefined) {
    throw new AppError('VALIDATION_ERROR', 'ayahNumber is required for ayah scope', 422);
  }

  const ayah = await AyahModel.findOne({
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
  }).lean();

  if (!ayah) {
    throw new AppError('NOT_FOUND', 'Ayah not found', 404);
  }

  const stored = await QuranAudioModel.findOne({
    reciterId: reciter._id,
    scope: 'ayah',
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
    isActive: true,
  }).lean();

  const audioUrl =
    stored?.audioUrl ?? `${reciter.cdnAyahBaseUrl}/${ayah.globalAyahNumber}.mp3`;

  return {
    items: [
      {
        id: stored?._id.toString() ?? `cdn:${reciter.slug}:${ayah.globalAyahNumber}`,
        scope: 'ayah' as const,
        surahNumber: input.surahNumber,
        ayahNumber: input.ayahNumber,
        audioUrl,
        bitrateKbps: stored?.bitrateKbps ?? 128,
        rights: stored?.rights ?? reciter.rights,
        reciter: {
          id: reciter._id.toString(),
          name: reciter.name,
          slug: reciter.slug,
        },
      },
    ],
  };
}

export async function getProgress(userId: string) {
  const rows = await QuranProgressModel.find({ userId }).lean();
  const surahNumbers = [...new Set(rows.map((row) => row.surahNumber))];
  const surahs = await SurahModel.find({ number: { $in: surahNumbers } }).lean();
  const surahMap = new Map(surahs.map((s) => [s.number, s]));

  return rows.map((row) => {
    const surah = surahMap.get(row.surahNumber);
    return {
      mode: row.mode,
      surahNumber: row.surahNumber,
      ayahNumber: row.ayahNumber,
      surahName:
        surah?.nameUz ?? surah?.nameLatin ?? `Surah ${row.surahNumber}`,
      nameArabic: surah ? cleanArabicText(surah.nameArabic) : null,
      updatedAt: row.updatedAt,
    };
  });
}

export async function upsertProgress(userId: string, input: UpsertProgressBody) {
  const ayah = await AyahModel.findOne({
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
  }).lean();

  if (!ayah) {
    throw new AppError('VALIDATION_ERROR', 'Ayah does not exist for this surah', 422);
  }

  const row = await QuranProgressModel.findOneAndUpdate(
    { userId, mode: input.mode },
    {
      userId,
      mode: input.mode,
      surahNumber: input.surahNumber,
      ayahNumber: input.ayahNumber,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return {
    mode: row.mode,
    surahNumber: row.surahNumber,
    ayahNumber: row.ayahNumber,
    updatedAt: row.updatedAt,
  };
}

export async function listBookmarks(userId: string) {
  const rows = await QuranBookmarkModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    surahNumber: row.surahNumber,
    ayahNumber: row.ayahNumber,
    note: row.note ?? null,
    createdAt: row.createdAt,
  }));
}

export async function createBookmark(userId: string, input: CreateBookmarkBody) {
  const ayah = await AyahModel.findOne({
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
  }).lean();

  if (!ayah) {
    throw new AppError('VALIDATION_ERROR', 'Ayah does not exist for this surah', 422);
  }

  try {
    const row = await QuranBookmarkModel.create({
      userId,
      surahNumber: input.surahNumber,
      ayahNumber: input.ayahNumber,
      note: input.note ?? null,
    });

    return {
      id: row._id.toString(),
      surahNumber: row.surahNumber,
      ayahNumber: row.ayahNumber,
      note: row.note ?? null,
      createdAt: row.createdAt,
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Bookmark already exists', 409);
    }
    throw error;
  }
}

export async function deleteBookmark(userId: string, bookmarkId: string) {
  if (!Types.ObjectId.isValid(bookmarkId)) {
    throw new AppError('NOT_FOUND', 'Bookmark not found', 404);
  }

  const deleted = await QuranBookmarkModel.findOneAndDelete({
    _id: bookmarkId,
    userId,
  });

  if (!deleted) {
    throw new AppError('NOT_FOUND', 'Bookmark not found', 404);
  }

  return { success: true };
}
