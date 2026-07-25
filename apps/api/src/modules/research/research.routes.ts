import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as researchController from './research.controller.js';
import {
  adminListQuerySchema,
  createResearchBodySchema,
  createResearchBookmarkBodySchema,
  listResearchQuerySchema,
  updateResearchBodySchema,
} from './research.validation.js';
import { setStatusBodySchema } from '../admin/admin.validation.js';

export const researchRouter = Router();
export const adminResearchRouter = Router();

const editorGuard = [authenticate, authorize('editor', 'admin')] as const;

researchRouter.get('/bookmarks', authenticate, researchController.listBookmarks);
researchRouter.post(
  '/bookmarks',
  authenticate,
  validateBody(createResearchBookmarkBodySchema),
  researchController.createBookmark,
);
researchRouter.delete(
  '/bookmarks/:id',
  authenticate,
  validateParams(z.object({ id: z.string().min(1) })),
  researchController.deleteBookmark,
);

researchRouter.get('/', validateQuery(listResearchQuerySchema), researchController.listResearch);
researchRouter.get(
  '/:slug',
  validateParams(z.object({ slug: z.string().min(1) })),
  researchController.getResearch,
);

adminResearchRouter.get(
  '/',
  ...editorGuard,
  validateQuery(adminListQuerySchema),
  researchController.adminListResearch,
);
adminResearchRouter.post(
  '/',
  ...editorGuard,
  validateBody(createResearchBodySchema),
  researchController.adminCreateResearch,
);
adminResearchRouter.patch(
  '/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateResearchBodySchema),
  researchController.adminUpdateResearch,
);
adminResearchRouter.post(
  '/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  researchController.adminPublishResearch,
);
adminResearchRouter.post(
  '/:id/status',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(setStatusBodySchema),
  researchController.adminSetResearchStatus,
);
adminResearchRouter.delete(
  '/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  researchController.adminDeleteResearch,
);
