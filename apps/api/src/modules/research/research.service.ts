import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { publicContentFilter, slugify, type ContentStatus } from '../../shared/utils/content.js';
import { assertEditorialStatusTransition } from '../../shared/utils/contentStatus.js';
import { sanitizeChapterBody } from '../../shared/utils/sanitize.js';
import { ResearchArticleModel } from './research.model.js';
import { ResearchBookmarkModel } from './researchBookmark.model.js';
import type {
  ContentSourceInput,
  CreateResearchBody,
  CreateResearchBookmarkBody,
  UpdateResearchBody,
} from './research.validation.js';
import type { SetStatusBody } from '../admin/admin.validation.js';

const BANNED_SOURCE_PATTERN =
  /\b(chatgpt|openai|claude\.ai|gemini|bard|copilot|ai\s*said|artificial\s*intelligence)\b/i;

function assertPublishableRights(licenseStatus: string) {
  if (licenseStatus === 'unknown') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Cannot publish content with unknown license status',
      422,
    );
  }
}

function assertValidSourcesForPublish(sources: ContentSourceInput[]) {
  if (!sources.length) {
    throw new AppError('VALIDATION_ERROR', 'At least one source is required to publish', 422);
  }

  for (const source of sources) {
    if (!source.title?.trim() || !source.type || !source.citation?.trim()) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Each source must include title, type, and citation',
        422,
      );
    }
    const haystack = `${source.title} ${source.citation} ${source.notes ?? ''}`;
    if (BANNED_SOURCE_PATTERN.test(haystack)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'AI assistants cannot be used as research sources',
        422,
      );
    }
  }
}

function toSourceDto(source: {
  title: string;
  type: string;
  citation: string;
  url?: string | null;
  notes?: string | null;
}) {
  return {
    title: source.title,
    type: source.type,
    citation: source.citation,
    url: source.url ?? null,
    notes: source.notes ?? null,
  };
}

function toArticleCard(article: {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  authors: string[];
  language: string;
  coverUrl?: string | null;
  publishedAt?: Date | null;
}) {
  return {
    id: article._id.toString(),
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    category: article.category,
    tags: article.tags,
    authors: article.authors,
    language: article.language,
    coverUrl: article.coverUrl ?? null,
    publishedAt: article.publishedAt ?? null,
  };
}

function toAdminArticle(article: {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  summary: string;
  body: string;
  bodyFormat: string;
  category: string;
  tags: string[];
  authors: string[];
  reviewer?: string | null;
  sources: Array<{
    title: string;
    type: string;
    citation: string;
    url?: string | null;
    notes?: string | null;
  }>;
  language: string;
  coverUrl?: string | null;
  status: string;
  rights: { licenseStatus: string; licenseNotes?: string | null };
  publishedAt?: Date | null;
  updatedAt: Date;
}) {
  return {
    ...toArticleCard(article),
    body: article.body,
    bodyFormat: article.bodyFormat,
    reviewer: article.reviewer ?? null,
    sources: article.sources.map(toSourceDto),
    status: article.status,
    rights: {
      licenseStatus: article.rights.licenseStatus,
      licenseNotes: article.rights.licenseNotes ?? null,
    },
    updatedAt: article.updatedAt,
  };
}

export async function listPublishedResearch(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  tag?: string;
}) {
  const filter: Record<string, unknown> = { ...publicContentFilter() };
  if (input.category) filter.category = input.category;
  if (input.tag) filter.tags = input.tag;
  if (input.q) {
    const regex = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { summary: regex }, { authors: regex }, { tags: regex }];
  }

  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    ResearchArticleModel.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .lean(),
    ResearchArticleModel.countDocuments(filter),
  ]);

  return {
    items: rows.map(toArticleCard),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function getPublishedResearchBySlug(slug: string) {
  const article = await ResearchArticleModel.findOne({
    slug,
    ...publicContentFilter(),
  }).lean();
  if (!article) throw new AppError('NOT_FOUND', 'Research article not found', 404);

  const related = await findRelatedArticles(article);

  return {
    article: {
      ...toArticleCard(article),
      body: article.body,
      bodyFormat: article.bodyFormat,
      reviewer: article.reviewer ?? null,
      sources: article.sources.map(toSourceDto),
    },
    related,
    rights: {
      licenseStatus: article.rights.licenseStatus,
      licenseNotes: article.rights.licenseNotes ?? null,
    },
  };
}

async function findRelatedArticles(
  article: {
    _id: Types.ObjectId;
    category: string;
    tags: string[];
  },
  limit = 4,
) {
  const or: Record<string, unknown>[] = [{ category: article.category }];
  if (article.tags?.length) {
    or.push({ tags: { $in: article.tags } });
  }

  const candidates = await ResearchArticleModel.find({
    ...publicContentFilter(),
    _id: { $ne: article._id },
    $or: or,
  })
    .sort({ publishedAt: -1 })
    .limit(40)
    .lean();

  const tagSet = new Set(article.tags ?? []);
  const scored = candidates
    .map((row) => {
      let score = 0;
      if (row.category === article.category) score += 2;
      for (const tag of row.tags ?? []) {
        if (tagSet.has(tag)) score += 1;
      }
      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.row.publishedAt ? new Date(a.row.publishedAt).getTime() : 0;
      const bTime = b.row.publishedAt ? new Date(b.row.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit)
    .map((item) => toArticleCard(item.row));

  return scored;
}

export async function listResearchBookmarks(userId: string) {
  const rows = await ResearchBookmarkModel.find({ userId }).sort({ createdAt: -1 }).lean();
  const articleIds = rows.map((row) => row.articleId);
  const articles = await ResearchArticleModel.find({
    _id: { $in: articleIds },
    ...publicContentFilter(),
  }).lean();
  const articleMap = new Map(articles.map((a) => [a._id.toString(), a]));

  return rows
    .map((row) => {
      const article = articleMap.get(row.articleId.toString());
      if (!article) return null;
      return {
        id: row._id.toString(),
        articleId: row.articleId.toString(),
        article: toArticleCard(article),
        createdAt: row.createdAt,
      };
    })
    .filter(Boolean);
}

export async function createResearchBookmark(userId: string, input: CreateResearchBookmarkBody) {
  if (!Types.ObjectId.isValid(input.articleId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid articleId', 422);
  }

  const article = await ResearchArticleModel.findOne({
    _id: input.articleId,
    ...publicContentFilter(),
  }).lean();
  if (!article) throw new AppError('NOT_FOUND', 'Research article not found', 404);

  try {
    const row = await ResearchBookmarkModel.create({
      userId,
      articleId: input.articleId,
    });
    return {
      id: row._id.toString(),
      articleId: row.articleId.toString(),
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

export async function deleteResearchBookmark(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Bookmark not found', 404);
  const deleted = await ResearchBookmarkModel.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new AppError('NOT_FOUND', 'Bookmark not found', 404);
  return { success: true };
}

// ——— Admin ———

export async function adminListResearch(input: {
  page: number;
  limit: number;
  status?: string;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (input.status) filter.status = input.status;
  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    ResearchArticleModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .lean(),
    ResearchArticleModel.countDocuments(filter),
  ]);

  return {
    items: rows.map(toAdminArticle),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function adminCreateResearch(userId: string, input: CreateResearchBody) {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);
  const bodyFormat = input.bodyFormat ?? 'html';
  const body = sanitizeChapterBody(input.body, bodyFormat);

  try {
    const row = await ResearchArticleModel.create({
      title: input.title,
      slug,
      summary: input.summary,
      body,
      bodyFormat,
      category: input.category,
      tags: input.tags ?? [],
      authors: input.authors,
      reviewer: input.reviewer ?? null,
      sources: input.sources ?? [],
      language: input.language ?? 'uz',
      coverUrl: input.coverUrl ?? null,
      rights: input.rights,
      createdBy: userId,
      status: 'draft',
    });
    return {
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      status: row.status,
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Research slug already exists', 409);
    }
    throw error;
  }
}

export async function adminUpdateResearch(userId: string, id: string, input: UpdateResearchBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Research article not found', 404);
  const row = await ResearchArticleModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Research article not found', 404);

  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.category !== undefined) row.category = input.category;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.authors !== undefined) row.authors = input.authors;
  if (input.reviewer !== undefined) row.reviewer = input.reviewer;
  if (input.sources !== undefined) row.set('sources', input.sources);
  if (input.language !== undefined) row.language = input.language;
  if (input.coverUrl !== undefined) row.coverUrl = input.coverUrl;
  if (input.rights !== undefined) row.rights = input.rights;
  if (input.bodyFormat !== undefined) row.bodyFormat = input.bodyFormat;
  if (input.body !== undefined) {
    row.body = sanitizeChapterBody(
      input.body,
      (input.bodyFormat ?? row.bodyFormat) as 'html' | 'markdown',
    );
  }

  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return {
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    status: row.status,
  };
}

export async function adminPublishResearch(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Research article not found', 404);
  const row = await ResearchArticleModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Research article not found', 404);

  assertPublishableRights(row.rights.licenseStatus);
  assertValidSourcesForPublish(row.sources as ContentSourceInput[]);

  if (!row.authors.length) {
    throw new AppError('VALIDATION_ERROR', 'At least one author is required to publish', 422);
  }
  if (!row.title.trim() || !row.summary.trim() || !row.body.trim() || !row.category.trim()) {
    throw new AppError('VALIDATION_ERROR', 'Article is missing required publish fields', 422);
  }

  row.body = sanitizeChapterBody(row.body, row.bodyFormat as 'html' | 'markdown');
  row.status = 'published';
  row.publishedAt = row.publishedAt ?? new Date();
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();

  return {
    id: row._id.toString(),
    status: row.status,
    publishedAt: row.publishedAt,
  };
}

export async function adminDeleteResearch(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Research article not found', 404);
  const row = await ResearchArticleModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Research article not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}

export async function adminSetResearchStatus(
  userId: string,
  id: string,
  input: SetStatusBody,
) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Research article not found', 404);
  const row = await ResearchArticleModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Research article not found', 404);

  assertEditorialStatusTransition(row.status as ContentStatus, input.status);
  row.status = input.status;
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status };
}
