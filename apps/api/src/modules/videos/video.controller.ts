import type { NextFunction, Request, Response } from 'express';
import * as videoService from './video.service.js';
import type {
  CreateEpisodeBody,
  CreateSeriesBody,
  UpdateEpisodeBody,
  UpdateSeriesBody,
  UpsertVideoProgressBody,
} from './video.validation.js';

export async function listSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      q?: string;
      topic?: string;
    };
    const result = await videoService.listPublishedSeries(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { slug: string };
    const data = await videoService.getPublishedSeriesBySlug(String(params.slug));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.getPublishedEpisodeById(String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const episodeId =
      typeof req.query.episodeId === 'string' ? req.query.episodeId : undefined;
    const data = await videoService.getProgress(req.user!.id, episodeId);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function upsertProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await videoService.upsertProgress(
      req.user!.id,
      req.body as UpsertVideoProgressBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      status?: 'draft' | 'in_review' | 'published' | 'archived';
    };
    const result = await videoService.adminListSeries(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await videoService.adminCreateSeries(
      req.user!.id,
      req.body as CreateSeriesBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminUpdateSeries(
      req.user!.id,
      String(params.id),
      req.body as UpdateSeriesBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminPublishSeries(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminSetSeriesStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminSetSeriesStatus(
      req.user!.id,
      String(params.id),
      req.body as { status: 'draft' | 'in_review' | 'archived' },
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminDeleteSeries(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminListEpisodes(String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await videoService.adminCreateEpisode(
      req.user!.id,
      req.body as CreateEpisodeBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminUpdateEpisode(
      req.user!.id,
      String(params.id),
      req.body as UpdateEpisodeBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminPublishEpisode(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await videoService.adminDeleteEpisode(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
