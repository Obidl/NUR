import type { NextFunction, Request, Response } from 'express';
import * as quranService from './quran.service.js';
import type {
  CreateBookmarkBody,
  UpsertProgressBody,
} from './quran.validation.js';

export async function listSurahs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as { q?: string };
    const data = await quranService.listSurahs(query.q);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getSurah(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { number: number | string };
    const number = Number(params.number);
    const data = await quranService.getSurahWithAyahs(number);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function searchAyahs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as { q: string; limit: number };
    const data = await quranService.searchAyahs(query.q, query.limit);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listReciters(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quranService.listReciters();
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listAudio(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      reciterId: string;
      surahNumber: number;
      ayahNumber?: number;
      scope?: 'ayah' | 'surah';
    };
    const data = await quranService.listAudio(query);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quranService.getProgress(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function upsertProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quranService.upsertProgress(
      req.user!.id,
      req.body as UpsertProgressBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quranService.listBookmarks(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quranService.createBookmark(
      req.user!.id,
      req.body as CreateBookmarkBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deleteBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await quranService.deleteBookmark(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
