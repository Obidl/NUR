import type { NextFunction, Request, Response } from 'express';
import * as libraryService from './library.service.js';

export async function getContinue(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await libraryService.getLibraryContinue(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await libraryService.getLibraryFavorites(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await libraryService.getLibraryBookmarks(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
