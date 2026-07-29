import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Env } from './config/env.js';
import { createCorsOptions } from './config/cors.js';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler.js';
import { apiRateLimiter } from './shared/middleware/rateLimit.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter, usersRouter } from './modules/auth/auth.routes.js';
import { quranRouter } from './modules/quran/quran.routes.js';
import {
  adminPodcastsRouter,
  podcastsRouter,
} from './modules/podcasts/podcast.routes.js';
import { adminBooksRouter, booksRouter } from './modules/books/book.routes.js';
import {
  adminResearchRouter,
  researchRouter,
} from './modules/research/research.routes.js';
import {
  adminCurriculumRouter,
  curriculumRouter,
} from './modules/curriculum/curriculum.routes.js';
import {
  adminVideosRouter,
  videosRouter,
} from './modules/videos/video.routes.js';
import { libraryRouter } from './modules/library/library.routes.js';
import { adminUsersRouter } from './modules/admin/adminUsers.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { Sentry } from './infrastructure/sentry.js';
import { AppError } from './shared/errors/AppError.js';

export function createApp(env: Env) {
  const app = express();

  app.set('trust proxy', 1);
  // SPA + in-app browsers (Telegram): keep Helmet light — COOP/CSP on JSON breaks WebViews.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      originAgentCluster: false,
    }),
  );
  app.use(cors(createCorsOptions(env)));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(apiRateLimiter);

  app.use(healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/quran', quranRouter);
  app.use('/api/v1/podcasts', podcastsRouter);
  app.use('/api/v1/admin/podcasts', adminPodcastsRouter);
  app.use('/api/v1/books', booksRouter);
  app.use('/api/v1/admin/books', adminBooksRouter);
  app.use('/api/v1/research', researchRouter);
  app.use('/api/v1/admin/research', adminResearchRouter);
  app.use('/api/v1/curriculum', curriculumRouter);
  app.use('/api/v1/admin/curriculum', adminCurriculumRouter);
  app.use('/api/v1/videos', videosRouter);
  app.use('/api/v1/admin/videos', adminVideosRouter);
  app.use('/api/v1/library', libraryRouter);
  app.use('/api/v1/admin/users', adminUsersRouter);
  app.use('/api/v1/search', searchRouter);

  app.get('/api/v1', (_req, res) => {
    res.status(200).json({
      data: {
        name: 'NUR API',
        version: 'v1',
        status: 'ok',
      },
    });
  });

  app.use(notFoundHandler);

  if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app, {
      shouldHandleError(error) {
        if (error instanceof AppError) return error.statusCode >= 500;
        return true;
      },
    });
  }

  app.use(errorHandler);

  return app;
}
