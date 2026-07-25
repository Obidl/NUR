import { z } from 'zod';

const rightsSchema = z.object({
  licenseStatus: z.enum([
    'owned',
    'licensed',
    'permission_granted',
    'public_domain',
    'unknown',
  ]),
  licenseNotes: z.string().trim().max(2000).optional().nullable(),
});

/** YouTube video IDs are 11 chars; also accept full watch URLs via preprocess in service. */
export const youtubeVideoIdSchema = z
  .string()
  .trim()
  .min(6)
  .max(200)
  .transform((value) => {
    const trimmed = value.trim();
    const fromUrl = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (fromUrl?.[1]) return fromUrl[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return trimmed;
  })
  .refine((id) => /^[a-zA-Z0-9_-]{11}$/.test(id), {
    message: 'Invalid YouTube video id or URL',
  });

export const listSeriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  topic: z.string().trim().min(1).max(80).optional(),
});

export const createSeriesBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().min(10).max(5000),
  hostOrScholar: z.string().trim().min(2).max(200),
  coverUrl: z.string().url(),
  language: z.string().trim().min(2).max(10).default('uz'),
  topics: z.array(z.string().trim().min(1).max(80)).default([]),
  channelUrl: z.string().url().optional().nullable(),
  rights: rightsSchema,
});

export const updateSeriesBodySchema = createSeriesBodySchema.partial();

export const createEpisodeBodySchema = z.object({
  seriesId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().min(10).max(10000),
  youtubeVideoId: youtubeVideoIdSchema,
  coverUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().min(1).optional().nullable(),
  episodeNumber: z.number().int().min(1).optional().nullable(),
  rights: rightsSchema,
});

export const updateEpisodeBodySchema = createEpisodeBodySchema
  .omit({ seriesId: true })
  .partial();

export const adminListQuerySchema = z.object({
  status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSeriesBody = z.infer<typeof createSeriesBodySchema>;
export type UpdateSeriesBody = z.infer<typeof updateSeriesBodySchema>;
export type CreateEpisodeBody = z.infer<typeof createEpisodeBodySchema>;
export type UpdateEpisodeBody = z.infer<typeof updateEpisodeBodySchema>;
