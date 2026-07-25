import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as bookController from './book.controller.js';
import {
  adminListQuerySchema,
  createBookBodySchema,
  createBookBookmarkBodySchema,
  createBookHighlightBodySchema,
  createChapterBodySchema,
  listBooksQuerySchema,
  listHighlightsQuerySchema,
  updateBookBodySchema,
  updateBookHighlightBodySchema,
  updateChapterBodySchema,
  upsertBookProgressBodySchema,
} from './book.validation.js';
import { setStatusBodySchema } from '../admin/admin.validation.js';

export const booksRouter = Router();
export const adminBooksRouter = Router();

const editorGuard = [authenticate, authorize('editor', 'admin')] as const;

booksRouter.get('/progress', authenticate, bookController.getProgress);
booksRouter.put(
  '/progress',
  authenticate,
  validateBody(upsertBookProgressBodySchema),
  bookController.upsertProgress,
);
booksRouter.get('/bookmarks', authenticate, bookController.listBookmarks);
booksRouter.post(
  '/bookmarks',
  authenticate,
  validateBody(createBookBookmarkBodySchema),
  bookController.createBookmark,
);
booksRouter.delete(
  '/bookmarks/:id',
  authenticate,
  validateParams(z.object({ id: z.string().min(1) })),
  bookController.deleteBookmark,
);

booksRouter.get(
  '/highlights',
  authenticate,
  validateQuery(listHighlightsQuerySchema),
  bookController.listHighlights,
);
booksRouter.post(
  '/highlights',
  authenticate,
  validateBody(createBookHighlightBodySchema),
  bookController.createHighlight,
);
booksRouter.patch(
  '/highlights/:id',
  authenticate,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateBookHighlightBodySchema),
  bookController.updateHighlight,
);
booksRouter.delete(
  '/highlights/:id',
  authenticate,
  validateParams(z.object({ id: z.string().min(1) })),
  bookController.deleteHighlight,
);

booksRouter.get('/', validateQuery(listBooksQuerySchema), bookController.listBooks);
booksRouter.get(
  '/:slug/chapters/:chapterSlug',
  validateParams(
    z.object({
      slug: z.string().min(1),
      chapterSlug: z.string().min(1),
    }),
  ),
  bookController.getChapter,
);
booksRouter.get(
  '/:slug',
  validateParams(z.object({ slug: z.string().min(1) })),
  bookController.getBook,
);

adminBooksRouter.get(
  '/',
  ...editorGuard,
  validateQuery(adminListQuerySchema),
  bookController.adminListBooks,
);
adminBooksRouter.post(
  '/',
  ...editorGuard,
  validateBody(createBookBodySchema),
  bookController.adminCreateBook,
);

adminBooksRouter.post(
  '/chapters',
  ...editorGuard,
  validateBody(createChapterBodySchema),
  bookController.adminCreateChapter,
);
adminBooksRouter.patch(
  '/chapters/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateChapterBodySchema),
  bookController.adminUpdateChapter,
);
adminBooksRouter.post(
  '/chapters/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  bookController.adminPublishChapter,
);
adminBooksRouter.delete(
  '/chapters/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  bookController.adminDeleteChapter,
);

adminBooksRouter.patch(
  '/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateBookBodySchema),
  bookController.adminUpdateBook,
);
adminBooksRouter.post(
  '/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  bookController.adminPublishBook,
);
adminBooksRouter.post(
  '/:id/status',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(setStatusBodySchema),
  bookController.adminSetBookStatus,
);
adminBooksRouter.delete(
  '/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  bookController.adminDeleteBook,
);
