import type { NextFunction, Request, Response } from 'express';
import * as bookService from './book.service.js';
import type {
  CreateBookBody,
  CreateBookBookmarkBody,
  CreateBookHighlightBody,
  CreateChapterBody,
  UpdateBookBody,
  UpdateBookHighlightBody,
  UpdateChapterBody,
  UpsertBookProgressBody,
} from './book.validation.js';

export async function listBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      q?: string;
      category?: string;
    };
    const result = await bookService.listPublishedBooks(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function getBook(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { slug: string };
    const data = await bookService.getPublishedBookBySlug(String(params.slug));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as {
      slug: string;
      chapterSlug: string;
    };
    const data = await bookService.getPublishedChapter(
      String(params.slug),
      String(params.chapterSlug),
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.getBookProgress(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function upsertProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.upsertBookProgress(
      req.user!.id,
      req.body as UpsertBookProgressBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.listBookBookmarks(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.createBookBookmark(
      req.user!.id,
      req.body as CreateBookBookmarkBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deleteBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.deleteBookBookmark(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listHighlights(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as { chapterId?: string; bookId?: string };
    const data = await bookService.listBookHighlights(req.user!.id, query);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createHighlight(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.createBookHighlight(
      req.user!.id,
      req.body as CreateBookHighlightBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateHighlight(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.updateBookHighlight(
      req.user!.id,
      String(params.id),
      req.body as UpdateBookHighlightBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function deleteHighlight(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.deleteBookHighlight(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      status?: string;
    };
    const result = await bookService.adminListBooks(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.adminCreateBook(req.user!.id, req.body as CreateBookBody);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateBook(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminUpdateBook(
      req.user!.id,
      String(params.id),
      req.body as UpdateBookBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishBook(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminPublishBook(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteBook(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminDeleteBook(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminListChapters(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminListChapters(String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminSetBookStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminSetBookStatus(
      req.user!.id,
      String(params.id),
      req.body as { status: 'draft' | 'in_review' | 'archived' },
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bookService.adminCreateChapter(
      req.user!.id,
      req.body as CreateChapterBody,
    );
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminUpdateChapter(
      req.user!.id,
      String(params.id),
      req.body as UpdateChapterBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminPublishChapter(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await bookService.adminDeleteChapter(req.user!.id, String(params.id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
