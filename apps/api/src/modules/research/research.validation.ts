import { z } from 'zod';
import { SOURCE_TYPES } from './research.model.js';

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

export const contentSourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.enum(SOURCE_TYPES),
  citation: z.string().trim().min(1).max(1000),
  url: z.string().url().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const listResearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  tag: z.string().trim().min(1).max(80).optional(),
});

export const createResearchBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  summary: z.string().trim().min(10).max(1000),
  body: z.string().trim().min(1),
  bodyFormat: z.enum(['html', 'markdown']).default('html'),
  category: z.string().trim().min(1).max(80),
  tags: z.array(z.string().trim().min(1).max(80)).default([]),
  authors: z.array(z.string().trim().min(1).max(120)).min(1),
  reviewer: z.string().trim().max(120).optional().nullable(),
  sources: z.array(contentSourceSchema).default([]),
  language: z.string().trim().min(2).max(10).default('uz'),
  coverUrl: z.string().url().optional().nullable(),
  rights: rightsSchema,
});

export const updateResearchBodySchema = createResearchBodySchema.partial();

export const createResearchBookmarkBodySchema = z.object({
  articleId: z.string().min(1),
});

export const adminListQuerySchema = z.object({
  status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateResearchBody = z.infer<typeof createResearchBodySchema>;
export type UpdateResearchBody = z.infer<typeof updateResearchBodySchema>;
export type CreateResearchBookmarkBody = z.infer<typeof createResearchBookmarkBodySchema>;
export type ContentSourceInput = z.infer<typeof contentSourceSchema>;
