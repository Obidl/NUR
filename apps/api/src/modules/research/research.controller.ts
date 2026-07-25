import type { NextFunction, Request, Response } from 'express';
import * as researchService from './research.service.js';
import type {
  CreateResearchBody,
  CreateResearchBookmarkBody,
  UpdateResearchBody,
} from './research.validation.js';

export async function listResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      q?: string;
      category?: string;
      tag?: string;
    };
    const result = await researchService.listPublishedResearch(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function getResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { slug: string };
    const data = await researchService.getPublishedResearchBySlug(String(params.slug));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await researchService.listResearchBookmarks(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await researchService.createResearchBookmark(
      req.user!.id,
      req.body as CreateResearchBookmarkBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deleteBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await researchService.deleteResearchBookmark(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      status?: string;
    };
    const result = await researchService.adminListResearch(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await researchService.adminCreateResearch(
      req.user!.id,
      req.body as CreateResearchBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await researchService.adminUpdateResearch(
      req.user!.id,
      String(params.id),
      req.body as UpdateResearchBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await researchService.adminPublishResearch(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteResearch(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await researchService.adminDeleteResearch(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminSetResearchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await researchService.adminSetResearchStatus(
      req.user!.id,
      String(params.id),
      req.body as { status: 'draft' | 'in_review' | 'archived' },
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
