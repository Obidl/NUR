import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as quranController from './quran.controller.js';
import {
  createBookmarkBodySchema,
  listAudioQuerySchema,
  listSurahsQuerySchema,
  searchAyahsQuerySchema,
  surahNumberParamSchema,
  upsertProgressBodySchema,
} from './quran.validation.js';

export const quranRouter = Router();

quranRouter.get(
  '/surahs',
  validateQuery(listSurahsQuerySchema),
  quranController.listSurahs,
);

quranRouter.get(
  '/surahs/:number',
  validateParams(z.object({ number: surahNumberParamSchema })),
  quranController.getSurah,
);

quranRouter.get(
  '/search',
  validateQuery(searchAyahsQuerySchema),
  quranController.searchAyahs,
);

quranRouter.get('/reciters', quranController.listReciters);

quranRouter.get(
  '/audio',
  validateQuery(listAudioQuerySchema),
  quranController.listAudio,
);

quranRouter.get('/progress', authenticate, quranController.getProgress);
quranRouter.put(
  '/progress',
  authenticate,
  validateBody(upsertProgressBodySchema),
  quranController.upsertProgress,
);

quranRouter.get('/bookmarks', authenticate, quranController.listBookmarks);
quranRouter.post(
  '/bookmarks',
  authenticate,
  validateBody(createBookmarkBodySchema),
  quranController.createBookmark,
);
quranRouter.delete(
  '/bookmarks/:id',
  authenticate,
  validateParams(z.object({ id: z.string().min(1) })),
  quranController.deleteBookmark,
);
