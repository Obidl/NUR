import type { NextFunction, Request, Response } from 'express';
import * as curriculumService from './curriculum.service.js';
import type {
  CreateLearningPathBody,
  UpdateLearningPathBody,
  UpsertPathProgressBody,
} from './curriculum.validation.js';

export async function listPaths(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as { page: number; limit: number; q?: string };
    const result = await curriculumService.listPublishedPaths(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function getPath(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { slug: string };
    const data = await curriculumService.getPublishedPathBySlug(String(params.slug));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await curriculumService.listPathProgress(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function upsertProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await curriculumService.upsertPathProgress(
      req.user!.id,
      req.body as UpsertPathProgressBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListPaths(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as { page: number; limit: number; status?: string };
    const result = await curriculumService.adminListPaths(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function adminCreatePath(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await curriculumService.adminCreatePath(
      req.user!.id,
      req.body as CreateLearningPathBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdatePath(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await curriculumService.adminUpdatePath(
      req.user!.id,
      String(params.id),
      req.body as UpdateLearningPathBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishPath(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await curriculumService.adminPublishPath(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeletePath(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await curriculumService.adminDeletePath(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminSetPathStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await curriculumService.adminSetPathStatus(
      req.user!.id,
      String(params.id),
      req.body as { status: 'draft' | 'in_review' | 'archived' },
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
