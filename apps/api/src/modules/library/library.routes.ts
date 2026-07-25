import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import * as libraryController from './library.controller.js';

export const libraryRouter = Router();

libraryRouter.get('/continue', authenticate, libraryController.getContinue);
libraryRouter.get('/favorites', authenticate, libraryController.getFavorites);
libraryRouter.get('/bookmarks', authenticate, libraryController.getBookmarks);
