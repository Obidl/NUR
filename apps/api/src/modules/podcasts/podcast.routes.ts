import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as podcastController from './podcast.controller.js';
import {
  adminListQuerySchema,
  createEpisodeBodySchema,
  createFavoriteBodySchema,
  createSeriesBodySchema,
  listSeriesQuerySchema,
  updateEpisodeBodySchema,
  updateSeriesBodySchema,
  upsertProgressBodySchema,
} from './podcast.validation.js';
import { setStatusBodySchema } from '../admin/admin.validation.js';

export const podcastsRouter = Router();
export const adminPodcastsRouter = Router();

podcastsRouter.get(
  '/series',
  validateQuery(listSeriesQuerySchema),
  podcastController.listSeries,
);

podcastsRouter.get(
  '/series/:slug',
  validateParams(z.object({ slug: z.string().min(1) })),
  podcastController.getSeries,
);

podcastsRouter.get(
  '/series/:slug/episodes/:episodeSlug',
  validateParams(
    z.object({
      slug: z.string().min(1),
      episodeSlug: z.string().min(1),
    }),
  ),
  podcastController.getEpisodeBySlugs,
);

podcastsRouter.get(
  '/episodes/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.getEpisode,
);

podcastsRouter.get('/progress', authenticate, podcastController.getProgress);
podcastsRouter.put(
  '/progress',
  authenticate,
  validateBody(upsertProgressBodySchema),
  podcastController.upsertProgress,
);

podcastsRouter.get('/favorites', authenticate, podcastController.listFavorites);
podcastsRouter.post(
  '/favorites',
  authenticate,
  validateBody(createFavoriteBodySchema),
  podcastController.createFavorite,
);
podcastsRouter.delete(
  '/favorites/:id',
  authenticate,
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.deleteFavorite,
);

const editorGuard = [authenticate, authorize('editor', 'admin')] as const;

adminPodcastsRouter.get(
  '/series',
  ...editorGuard,
  validateQuery(adminListQuerySchema),
  podcastController.adminListSeries,
);
adminPodcastsRouter.post(
  '/series',
  ...editorGuard,
  validateBody(createSeriesBodySchema),
  podcastController.adminCreateSeries,
);
adminPodcastsRouter.patch(
  '/series/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateSeriesBodySchema),
  podcastController.adminUpdateSeries,
);
adminPodcastsRouter.post(
  '/series/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.adminPublishSeries,
);
adminPodcastsRouter.post(
  '/series/:id/status',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(setStatusBodySchema),
  podcastController.adminSetSeriesStatus,
);
adminPodcastsRouter.delete(
  '/series/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.adminDeleteSeries,
);

adminPodcastsRouter.get(
  '/series/:id/episodes',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.adminListEpisodes,
);

adminPodcastsRouter.post(
  '/episodes',
  ...editorGuard,
  validateBody(createEpisodeBodySchema),
  podcastController.adminCreateEpisode,
);
adminPodcastsRouter.patch(
  '/episodes/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateEpisodeBodySchema),
  podcastController.adminUpdateEpisode,
);
adminPodcastsRouter.post(
  '/episodes/:id/publish',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.adminPublishEpisode,
);
adminPodcastsRouter.delete(
  '/episodes/:id',
  ...editorGuard,
  validateParams(z.object({ id: z.string().min(1) })),
  podcastController.adminDeleteEpisode,
);
