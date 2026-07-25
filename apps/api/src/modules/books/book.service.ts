import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { publicContentFilter, slugify, type ContentStatus } from '../../shared/utils/content.js';
import { assertEditorialStatusTransition } from '../../shared/utils/contentStatus.js';
import { sanitizeChapterBody } from '../../shared/utils/sanitize.js';
import { BookModel } from './book.model.js';
import { BookChapterModel } from './bookChapter.model.js';
import { BookProgressModel } from './bookProgress.model.js';
import { BookBookmarkModel } from './bookBookmark.model.js';
import { BookHighlightModel } from './bookHighlight.model.js';
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
import type { SetStatusBody } from '../admin/admin.validation.js';

function assertPublishableRights(licenseStatus: string) {
  if (licenseStatus === 'unknown') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Cannot publish content with unknown license status',
      422,
    );
  }
}

function toBookCard(book: {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  authors: string[];
  translator?: string | null;
  description: string;
  coverUrl: string;
  language: string;
  categories: string[];
  publishedAt?: Date | null;
}) {
  return {
    id: book._id.toString(),
    title: book.title,
    slug: book.slug,
    authors: book.authors,
    translator: book.translator ?? null,
    description: book.description,
    coverUrl: book.coverUrl,
    language: book.language,
    categories: book.categories,
    publishedAt: book.publishedAt ?? null,
  };
}

export async function listPublishedBooks(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
}) {
  const filter: Record<string, unknown> = { ...publicContentFilter() };
  if (input.category) filter.categories = input.category;
  if (input.q) {
    const regex = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { authors: regex }, { description: regex }];
  }

  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    BookModel.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(input.limit).lean(),
    BookModel.countDocuments(filter),
  ]);

  return {
    items: rows.map(toBookCard),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function getPublishedBookBySlug(slug: string) {
  const book = await BookModel.findOne({ slug, ...publicContentFilter() }).lean();
  if (!book) throw new AppError('NOT_FOUND', 'Book not found', 404);

  const chapters = await BookChapterModel.find({
    bookId: book._id,
    ...publicContentFilter(),
  })
    .sort({ order: 1 })
    .select('title slug order publishedAt')
    .lean();

  return {
    book: toBookCard(book),
    chapters: chapters.map((ch) => ({
      id: ch._id.toString(),
      title: ch.title,
      slug: ch.slug,
      order: ch.order,
      publishedAt: ch.publishedAt ?? null,
    })),
    rights: {
      licenseStatus: book.rights.licenseStatus,
      licenseNotes: book.rights.licenseNotes ?? null,
    },
  };
}

export async function getPublishedChapter(bookSlug: string, chapterSlug: string) {
  const book = await BookModel.findOne({ slug: bookSlug, ...publicContentFilter() }).lean();
  if (!book) throw new AppError('NOT_FOUND', 'Chapter not found', 404);

  const chapter = await BookChapterModel.findOne({
    bookId: book._id,
    slug: chapterSlug,
    ...publicContentFilter(),
  }).lean();
  if (!chapter) throw new AppError('NOT_FOUND', 'Chapter not found', 404);

  return {
    book: {
      id: book._id.toString(),
      title: book.title,
      slug: book.slug,
      authors: book.authors,
      translator: book.translator ?? null,
    },
    chapter: {
      id: chapter._id.toString(),
      title: chapter.title,
      slug: chapter.slug,
      order: chapter.order,
      body: chapter.body,
      bodyFormat: chapter.bodyFormat,
      publishedAt: chapter.publishedAt ?? null,
    },
  };
}

export async function getBookProgress(userId: string) {
  const rows = await BookProgressModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  const bookIds = rows.map((r) => r.bookId);
  const chapterIds = rows.map((r) => r.chapterId);

  const [books, chapters] = await Promise.all([
    BookModel.find({ _id: { $in: bookIds }, ...publicContentFilter() }).lean(),
    BookChapterModel.find({ _id: { $in: chapterIds }, ...publicContentFilter() }).lean(),
  ]);

  const bookMap = new Map(books.map((b) => [b._id.toString(), b]));
  const chapterMap = new Map(chapters.map((c) => [c._id.toString(), c]));

  return rows
    .map((row) => {
      const book = bookMap.get(row.bookId.toString());
      const chapter = chapterMap.get(row.chapterId.toString());
      if (!book || !chapter) return null;
      return {
        bookId: book._id.toString(),
        bookSlug: book.slug,
        bookTitle: book.title,
        coverUrl: book.coverUrl,
        chapterId: chapter._id.toString(),
        chapterSlug: chapter.slug,
        chapterTitle: chapter.title,
        position: {
          scrollRatio: row.position?.scrollRatio ?? 0,
          blockId: row.position?.blockId ?? null,
        },
        updatedAt: row.updatedAt,
      };
    })
    .filter(Boolean);
}

export async function upsertBookProgress(userId: string, input: UpsertBookProgressBody) {
  if (!Types.ObjectId.isValid(input.bookId) || !Types.ObjectId.isValid(input.chapterId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid bookId or chapterId', 422);
  }

  const book = await BookModel.findOne({ _id: input.bookId, ...publicContentFilter() }).lean();
  if (!book) throw new AppError('NOT_FOUND', 'Book not found', 404);

  const chapter = await BookChapterModel.findOne({
    _id: input.chapterId,
    bookId: input.bookId,
    ...publicContentFilter(),
  }).lean();
  if (!chapter) throw new AppError('NOT_FOUND', 'Chapter not found', 404);

  const row = await BookProgressModel.findOneAndUpdate(
    { userId, bookId: input.bookId },
    {
      userId,
      bookId: input.bookId,
      chapterId: input.chapterId,
      position: {
        scrollRatio: input.position.scrollRatio ?? 0,
        blockId: input.position.blockId ?? null,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return {
    bookId: row.bookId.toString(),
    chapterId: row.chapterId.toString(),
    position: {
      scrollRatio: row.position?.scrollRatio ?? 0,
      blockId: row.position?.blockId ?? null,
    },
    updatedAt: row.updatedAt,
  };
}

export async function listBookBookmarks(userId: string) {
  const rows = await BookBookmarkModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    bookId: row.bookId.toString(),
    chapterId: row.chapterId.toString(),
    note: row.note ?? null,
    createdAt: row.createdAt,
  }));
}

export async function createBookBookmark(userId: string, input: CreateBookBookmarkBody) {
  if (!Types.ObjectId.isValid(input.bookId) || !Types.ObjectId.isValid(input.chapterId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid bookId or chapterId', 422);
  }

  const chapter = await BookChapterModel.findOne({
    _id: input.chapterId,
    bookId: input.bookId,
    ...publicContentFilter(),
  }).lean();
  if (!chapter) throw new AppError('NOT_FOUND', 'Chapter not found', 404);

  try {
    const row = await BookBookmarkModel.create({
      userId,
      bookId: input.bookId,
      chapterId: input.chapterId,
      note: input.note ?? null,
    });
    return {
      id: row._id.toString(),
      bookId: row.bookId.toString(),
      chapterId: row.chapterId.toString(),
      note: row.note ?? null,
      createdAt: row.createdAt,
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Bookmark already exists', 409);
    }
    throw error;
  }
}

export async function deleteBookBookmark(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Bookmark not found', 404);
  const deleted = await BookBookmarkModel.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new AppError('NOT_FOUND', 'Bookmark not found', 404);
  return { success: true };
}

function toHighlightDto(row: {
  _id: Types.ObjectId;
  bookId: Types.ObjectId;
  chapterId: Types.ObjectId;
  selectedText: string;
  note?: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row._id.toString(),
    bookId: row.bookId.toString(),
    chapterId: row.chapterId.toString(),
    selectedText: row.selectedText,
    note: row.note ?? null,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listBookHighlights(
  userId: string,
  input: { chapterId?: string; bookId?: string },
) {
  const filter: Record<string, unknown> = { userId };
  if (input.chapterId) {
    if (!Types.ObjectId.isValid(input.chapterId)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid chapterId', 422);
    }
    filter.chapterId = input.chapterId;
  }
  if (input.bookId) {
    if (!Types.ObjectId.isValid(input.bookId)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid bookId', 422);
    }
    filter.bookId = input.bookId;
  }

  const rows = await BookHighlightModel.find(filter).sort({ createdAt: -1 }).lean();
  return rows.map(toHighlightDto);
}

export async function createBookHighlight(userId: string, input: CreateBookHighlightBody) {
  if (!Types.ObjectId.isValid(input.bookId) || !Types.ObjectId.isValid(input.chapterId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid bookId or chapterId', 422);
  }

  const chapter = await BookChapterModel.findOne({
    _id: input.chapterId,
    bookId: input.bookId,
    ...publicContentFilter(),
  }).lean();
  if (!chapter) throw new AppError('NOT_FOUND', 'Chapter not found', 404);

  const row = await BookHighlightModel.create({
    userId,
    bookId: input.bookId,
    chapterId: input.chapterId,
    selectedText: input.selectedText.trim(),
    note: input.note?.trim() ? input.note.trim() : null,
    color: input.color ?? 'lamp',
  });

  return toHighlightDto(row);
}

export async function updateBookHighlight(
  userId: string,
  id: string,
  input: UpdateBookHighlightBody,
) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Highlight not found', 404);
  const row = await BookHighlightModel.findOne({ _id: id, userId });
  if (!row) throw new AppError('NOT_FOUND', 'Highlight not found', 404);

  if (input.note !== undefined) row.note = input.note;
  if (input.color !== undefined) row.color = input.color;
  await row.save();
  return toHighlightDto(row);
}

export async function deleteBookHighlight(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Highlight not found', 404);
  const deleted = await BookHighlightModel.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new AppError('NOT_FOUND', 'Highlight not found', 404);
  return { success: true };
}

// ——— Admin ———

export async function adminListBooks(input: {
  page: number;
  limit: number;
  status?: string;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (input.status) filter.status = input.status;
  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    BookModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(input.limit).lean(),
    BookModel.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({
      ...toBookCard(row),
      status: row.status,
      rights: row.rights,
    })),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function adminCreateBook(userId: string, input: CreateBookBody) {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);
  try {
    const row = await BookModel.create({
      ...input,
      slug,
      createdBy: userId,
      status: 'draft',
    });
    return { id: row._id.toString(), title: row.title, slug: row.slug, status: row.status };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Book slug already exists', 409);
    }
    throw error;
  }
}

export async function adminUpdateBook(userId: string, id: string, input: UpdateBookBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Book not found', 404);
  const row = await BookModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Book not found', 404);
  Object.assign(row, input, { updatedBy: userId });
  await row.save();
  return { id: row._id.toString(), title: row.title, slug: row.slug, status: row.status };
}

export async function adminPublishBook(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Book not found', 404);
  const row = await BookModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Book not found', 404);
  assertPublishableRights(row.rights.licenseStatus);
  if (!row.authors.length || !row.coverUrl || !row.description) {
    throw new AppError('VALIDATION_ERROR', 'Book is missing required publish fields', 422);
  }
  row.status = 'published';
  row.publishedAt = row.publishedAt ?? new Date();
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status, publishedAt: row.publishedAt };
}

export async function adminDeleteBook(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Book not found', 404);
  const row = await BookModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Book not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}

export async function adminListChapters(bookId: string) {
  if (!Types.ObjectId.isValid(bookId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid bookId', 422);
  }
  const book = await BookModel.findOne({ _id: bookId, deletedAt: null }).lean();
  if (!book) throw new AppError('NOT_FOUND', 'Book not found', 404);

  const rows = await BookChapterModel.find({
    bookId,
    deletedAt: null,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return rows.map((row) => ({
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    order: row.order,
    body: row.body,
    bodyFormat: row.bodyFormat,
    status: row.status,
    publishedAt: row.publishedAt,
  }));
}

export async function adminCreateChapter(userId: string, input: CreateChapterBody) {
  if (!Types.ObjectId.isValid(input.bookId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid bookId', 422);
  }
  const book = await BookModel.findOne({ _id: input.bookId, deletedAt: null });
  if (!book) throw new AppError('NOT_FOUND', 'Book not found', 404);

  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);
  const bodyFormat = input.bodyFormat ?? 'html';
  const body = sanitizeChapterBody(input.body, bodyFormat);

  try {
    const row = await BookChapterModel.create({
      bookId: input.bookId,
      title: input.title,
      slug,
      order: input.order,
      body,
      bodyFormat,
      createdBy: userId,
      status: 'draft',
    });
    return {
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      status: row.status,
      bookId: row.bookId.toString(),
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Chapter slug or order already exists', 409);
    }
    throw error;
  }
}

export async function adminUpdateChapter(
  userId: string,
  id: string,
  input: UpdateChapterBody,
) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Chapter not found', 404);
  const row = await BookChapterModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Chapter not found', 404);

  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.order !== undefined) row.order = input.order;
  if (input.bodyFormat !== undefined) row.bodyFormat = input.bodyFormat;
  if (input.body !== undefined) {
    row.body = sanitizeChapterBody(input.body, (input.bodyFormat ?? row.bodyFormat) as 'html' | 'markdown');
  }
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), title: row.title, slug: row.slug, status: row.status };
}

export async function adminPublishChapter(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Chapter not found', 404);
  const row = await BookChapterModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Chapter not found', 404);
  if (!row.body.trim()) {
    throw new AppError('VALIDATION_ERROR', 'Chapter body is required', 422);
  }

  const book = await BookModel.findOne({ _id: row.bookId, deletedAt: null });
  if (!book || book.status !== 'published') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Parent book must be published before publishing a chapter',
      422,
    );
  }

  row.body = sanitizeChapterBody(row.body, row.bodyFormat as 'html' | 'markdown');
  row.status = 'published';
  row.publishedAt = row.publishedAt ?? new Date();
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status, publishedAt: row.publishedAt };
}

export async function adminDeleteChapter(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Chapter not found', 404);
  const row = await BookChapterModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Chapter not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}

export async function adminSetBookStatus(userId: string, id: string, input: SetStatusBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Book not found', 404);
  const row = await BookModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Book not found', 404);
  assertEditorialStatusTransition(row.status as ContentStatus, input.status);
  row.status = input.status;
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status };
}
