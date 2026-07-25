import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as curriculumController from './curriculum.controller.js';
import {
  adminListQuerySchema,
  createLearningPathBodySchema,
  listPathsQuerySchema,
  updateLearningPathBodySchema,
  upsertPathProgressBodySchema,
} from './curriculum.validation.js';
import { setStatusBodySchema } from '../admin/admin.validation.js';

export const curriculumRouter = Router();
export const adminCurriculumRouter = Router();

const editorGuard = [authenticate, authorize('editor', 'admin')] as const;

curriculumRouter.get('/paths', validateQuery(listPathsQuerySchema), curriculumController.listPaths);
curriculumRouter.get(
  '/paths/:slug',
  validateParams(z.object({ slug: z.string().min(1) })),
  curriculumController.getPath,
);
curriculumRouter.get('/progress', authenticate, curriculumController.listProgress);
curriculumRouter.put(
  '/progress',
  authenticate,
  validateBody(upsertPathProgressBodySchema),
  curriculumController.upsertProgress,
);

adminCurriculumRouter.get(
  '/',
  ...editorGuard,
  validateQuery(adminListQuerySchema),
  curriculumController.adminListPaths,
);
adminCurriculumRouter.post(
  '/',
  ...editorGuard,
  validateBody(createLearningPathBodySchema),
  curriculumController.adminCreatePath,
);
adminCurriculumRouter.patch(
  '/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateLearningPathBodySchema),
  curriculumController.adminUpdatePath,
);
adminCurriculumRouter.post(
  '/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  curriculumController.adminPublishPath,
);
adminCurriculumRouter.post(
  '/:id/status',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(setStatusBodySchema),
  curriculumController.adminSetPathStatus,
);
adminCurriculumRouter.delete(
  '/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  curriculumController.adminDeletePath,
);
