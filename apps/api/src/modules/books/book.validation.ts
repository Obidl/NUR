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

export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(80).optional(),
});

export const createBookBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  authors: z.array(z.string().trim().min(1).max(120)).min(1),
  translator: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().min(10).max(5000),
  coverUrl: z.string().url(),
  language: z.string().trim().min(2).max(10).default('uz'),
  categories: z.array(z.string().trim().min(1).max(80)).default([]),
  rights: rightsSchema,
});

export const updateBookBodySchema = createBookBodySchema.partial();

export const createChapterBodySchema = z.object({
  bookId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  order: z.number().int().min(1),
  body: z.string().trim().min(1),
  bodyFormat: z.enum(['html', 'markdown']).default('html'),
});

export const updateChapterBodySchema = createChapterBodySchema
  .omit({ bookId: true })
  .partial();

export const upsertBookProgressBodySchema = z.object({
  bookId: z.string().min(1),
  chapterId: z.string().min(1),
  position: z
    .object({
      scrollRatio: z.number().min(0).max(1).optional(),
      blockId: z.string().trim().max(120).optional().nullable(),
    })
    .default({}),
});

export const createBookBookmarkBodySchema = z.object({
  bookId: z.string().min(1),
  chapterId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
});

export const listHighlightsQuerySchema = z.object({
  chapterId: z.string().min(1).optional(),
  bookId: z.string().min(1).optional(),
});

export const createBookHighlightBodySchema = z.object({
  bookId: z.string().min(1),
  chapterId: z.string().min(1),
  selectedText: z.string().trim().min(1).max(2000),
  note: z.string().trim().max(1000).optional().nullable(),
  color: z.enum(['lamp', 'soft']).default('lamp'),
});

export const updateBookHighlightBodySchema = z
  .object({
    note: z.string().trim().max(1000).nullable().optional(),
    color: z.enum(['lamp', 'soft']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const adminListQuerySchema = z.object({
  status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBookBody = z.infer<typeof createBookBodySchema>;
export type UpdateBookBody = z.infer<typeof updateBookBodySchema>;
export type CreateChapterBody = z.infer<typeof createChapterBodySchema>;
export type UpdateChapterBody = z.infer<typeof updateChapterBodySchema>;
export type UpsertBookProgressBody = z.infer<typeof upsertBookProgressBodySchema>;
export type CreateBookBookmarkBody = z.infer<typeof createBookBookmarkBodySchema>;
export type CreateBookHighlightBody = z.infer<typeof createBookHighlightBodySchema>;
export type UpdateBookHighlightBody = z.infer<typeof updateBookHighlightBodySchema>;
