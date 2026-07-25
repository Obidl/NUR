import { z } from 'zod';
import { LESSON_TARGET_TYPES } from './curriculum.model.js';

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

const quranRangeRefSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahFrom: z.number().int().min(1),
  ayahTo: z.number().int().min(1),
});

const podcastEpisodeRefSchema = z.object({
  episodeId: z.string().min(1),
});

const bookChapterRefSchema = z.object({
  bookId: z.string().min(1),
  chapterId: z.string().min(1),
});

const researchArticleRefSchema = z.object({
  articleId: z.string().min(1),
});

export const lessonInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    order: z.number().int().min(1),
    estimatedMinutes: z.number().int().min(1).optional().nullable(),
    targetType: z.enum(LESSON_TARGET_TYPES),
    targetRef: z.record(z.string(), z.unknown()),
  })
  .superRefine((lesson, ctx) => {
    const refResult = resolveTargetRefSchema(lesson.targetType, lesson.targetRef);
    if (!refResult.success) {
      for (const issue of refResult.error.issues) {
        ctx.addIssue({
          code: 'custom',
          message: issue.message,
          path: ['targetRef', ...(issue.path ?? [])],
        });
      }
      return;
    }

    if (
      lesson.targetType === 'quran_range' &&
      refResult.success &&
      'ayahFrom' in refResult.data &&
      'ayahTo' in refResult.data &&
      refResult.data.ayahFrom > refResult.data.ayahTo
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'ayahFrom must be less than or equal to ayahTo',
        path: ['targetRef'],
      });
    }
  });

function resolveTargetRefSchema(
  targetType: (typeof LESSON_TARGET_TYPES)[number],
  targetRef: Record<string, unknown>,
) {
  switch (targetType) {
    case 'quran_range':
      return quranRangeRefSchema.safeParse(targetRef);
    case 'podcast_episode':
      return podcastEpisodeRefSchema.safeParse(targetRef);
    case 'book_chapter':
      return bookChapterRefSchema.safeParse(targetRef);
    case 'research_article':
      return researchArticleRefSchema.safeParse(targetRef);
  }
}

export const moduleInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  order: z.number().int().min(1),
  summary: z.string().trim().max(1000).optional().nullable(),
  lessons: z.array(lessonInputSchema).default([]),
});

export const listPathsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
});

export const createLearningPathBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  summary: z.string().trim().min(10).max(2000),
  coverUrl: z.string().url().optional().nullable(),
  language: z.string().trim().min(2).max(10).default('uz'),
  authors: z.array(z.string().trim().min(1).max(120)).min(1),
  modules: z.array(moduleInputSchema).default([]),
  rights: rightsSchema,
});

export const updateLearningPathBodySchema = createLearningPathBodySchema.partial();

export const adminListQuerySchema = z.object({
  status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const upsertPathProgressBodySchema = z.object({
  pathId: z.string().min(1),
  currentLessonId: z.string().min(1).optional(),
  completedLessonIds: z.array(z.string().min(1)).optional(),
  completeLessonId: z.string().min(1).optional(),
});

export type CreateLearningPathBody = z.infer<typeof createLearningPathBodySchema>;
export type UpdateLearningPathBody = z.infer<typeof updateLearningPathBodySchema>;
export type UpsertPathProgressBody = z.infer<typeof upsertPathProgressBodySchema>;
export type LessonInput = z.infer<typeof lessonInputSchema>;
export type ModuleInput = z.infer<typeof moduleInputSchema>;
