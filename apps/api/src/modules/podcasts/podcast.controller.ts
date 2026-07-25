import type { NextFunction, Request, Response } from 'express';
import * as podcastService from './podcast.service.js';
import type {
  CreateEpisodeBody,
  CreateFavoriteBody,
  CreateSeriesBody,
  UpdateEpisodeBody,
  UpdateSeriesBody,
  UpsertProgressBody,
} from './podcast.validation.js';

export async function listSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      q?: string;
      topic?: string;
    };
    const result = await podcastService.listPublishedSeries(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { slug: string };
    const data = await podcastService.getPublishedSeriesBySlug(String(params.slug));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await podcastService.getPublishedEpisodeById(String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getEpisodeBySlugs(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as {
      slug: string;
      episodeSlug: string;
    };
    const data = await podcastService.getPublishedEpisodeBySlugs(
      String(params.slug),
      String(params.episodeSlug),
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const episodeId =
      typeof req.query.episodeId === 'string' ? req.query.episodeId : undefined;
    const data = await podcastService.getProgress(req.user!.id, episodeId);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function upsertProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await podcastService.upsertProgress(
      req.user!.id,
      req.body as UpsertProgressBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await podcastService.listFavorites(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await podcastService.createFavorite(
      req.user!.id,
      req.body as CreateFavoriteBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deleteFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await podcastService.deleteFavorite(req.user!.id, String(params.id));
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
      status?: string;
    };
    const result = await podcastService.adminListSeries(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await podcastService.adminCreateSeries(
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
    const data = await podcastService.adminUpdateSeries(
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
    const data = await podcastService.adminPublishSeries(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await podcastService.adminDeleteSeries(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await podcastService.adminListEpisodes(String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminSetSeriesStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await podcastService.adminSetSeriesStatus(
      req.user!.id,
      String(params.id),
      req.body as { status: 'draft' | 'in_review' | 'archived' },
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await podcastService.adminCreateEpisode(
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
    const data = await podcastService.adminUpdateEpisode(
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
    const data = await podcastService.adminPublishEpisode(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await podcastService.adminDeleteEpisode(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
