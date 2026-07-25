import { Router } from 'express';
import { validateQuery } from '../../shared/middleware/validate.js';
import * as searchController from './search.controller.js';
import { searchQuerySchema } from './search.validation.js';

export const searchRouter = Router();

searchRouter.get('/', validateQuery(searchQuerySchema), searchController.search);
