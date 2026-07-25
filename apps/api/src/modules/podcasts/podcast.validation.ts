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
  rights: rightsSchema,
});

export const updateSeriesBodySchema = createSeriesBodySchema.partial();

export const createEpisodeBodySchema = z.object({
  seriesId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().min(10).max(10000),
  audioUrl: z.string().url(),
  coverUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().min(1),
  episodeNumber: z.number().int().min(1).optional().nullable(),
  rights: rightsSchema,
});

export const updateEpisodeBodySchema = createEpisodeBodySchema
  .omit({ seriesId: true })
  .partial();

export const upsertProgressBodySchema = z.object({
  episodeId: z.string().min(1),
  positionSeconds: z.number().min(0),
  durationSeconds: z.number().min(1),
  completed: z.boolean().optional(),
});

export const createFavoriteBodySchema = z.object({
  targetType: z.enum(['series', 'episode']),
  targetId: z.string().min(1),
});

export const adminListQuerySchema = z.object({
  status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSeriesBody = z.infer<typeof createSeriesBodySchema>;
export type UpdateSeriesBody = z.infer<typeof updateSeriesBodySchema>;
export type CreateEpisodeBody = z.infer<typeof createEpisodeBodySchema>;
export type UpdateEpisodeBody = z.infer<typeof updateEpisodeBodySchema>;
export type UpsertProgressBody = z.infer<typeof upsertProgressBodySchema>;
export type CreateFavoriteBody = z.infer<typeof createFavoriteBodySchema>;
