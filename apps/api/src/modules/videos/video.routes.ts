import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as videoController from './video.controller.js';
import {
  adminListQuerySchema,
  createEpisodeBodySchema,
  createSeriesBodySchema,
  listSeriesQuerySchema,
  updateEpisodeBodySchema,
  updateSeriesBodySchema,
} from './video.validation.js';
import { setStatusBodySchema } from '../admin/admin.validation.js';

export const videosRouter = Router();
export const adminVideosRouter = Router();

videosRouter.get('/series', validateQuery(listSeriesQuerySchema), videoController.listSeries);
videosRouter.get(
  '/series/:slug',
  validateParams(z.object({ slug: z.string().min(1) })),
  videoController.getSeries,
);
videosRouter.get(
  '/episodes/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  videoController.getEpisode,
);

const editorGuard = [authenticate, authorize('editor', 'admin')] as const;

adminVideosRouter.get(
  '/series',
  ...editorGuard,
  validateQuery(adminListQuerySchema),
  videoController.adminListSeries,
);
adminVideosRouter.post(
  '/series',
  ...editorGuard,
  validateBody(createSeriesBodySchema),
  videoController.adminCreateSeries,
);
adminVideosRouter.patch(
  '/series/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateSeriesBodySchema),
  videoController.adminUpdateSeries,
);
adminVideosRouter.post(
  '/series/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  videoController.adminPublishSeries,
);
adminVideosRouter.post(
  '/series/:id/status',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(setStatusBodySchema),
  videoController.adminSetSeriesStatus,
);
adminVideosRouter.delete(
  '/series/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  videoController.adminDeleteSeries,
);
adminVideosRouter.get(
  '/series/:id/episodes',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  videoController.adminListEpisodes,
);
adminVideosRouter.post(
  '/episodes',
  ...editorGuard,
  validateBody(createEpisodeBodySchema),
  videoController.adminCreateEpisode,
);
adminVideosRouter.patch(
  '/episodes/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateEpisodeBodySchema),
  videoController.adminUpdateEpisode,
);
adminVideosRouter.post(
  '/episodes/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  videoController.adminPublishEpisode,
);
adminVideosRouter.delete(
  '/episodes/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  videoController.adminDeleteEpisode,
);
