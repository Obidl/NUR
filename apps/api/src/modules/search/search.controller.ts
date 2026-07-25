import type { NextFunction, Request, Response } from 'express';
import * as searchService from './search.service.js';
import type { SearchQuery } from './search.validation.js';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as SearchQuery;
    const data = await searchService.globalSearch(query);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
