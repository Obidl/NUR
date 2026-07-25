import { z } from 'zod';

export const surahNumberParamSchema = z.coerce.number().int().min(1).max(114);

export const listSurahsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
});

export const listAudioQuerySchema = z.object({
  reciterId: z.string().min(1),
  surahNumber: z.coerce.number().int().min(1).max(114),
  ayahNumber: z.coerce.number().int().min(1).optional(),
  scope: z.enum(['ayah', 'surah']).optional(),
});

export const searchAyahsQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const upsertProgressBodySchema = z.object({
  mode: z.enum(['read', 'listen']),
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1),
});

export const createBookmarkBodySchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1),
  note: z.string().trim().max(500).optional(),
});

export type UpsertProgressBody = z.infer<typeof upsertProgressBodySchema>;
export type CreateBookmarkBody = z.infer<typeof createBookmarkBodySchema>;
