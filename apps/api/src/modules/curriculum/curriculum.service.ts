import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { publicContentFilter, slugify, type ContentStatus } from '../../shared/utils/content.js';
import { assertEditorialStatusTransition } from '../../shared/utils/contentStatus.js';
import { AyahModel } from '../quran/ayah.model.js';
import { SurahModel } from '../quran/surah.model.js';
import { PodcastEpisodeModel } from '../podcasts/podcastEpisode.model.js';
import { PodcastSeriesModel } from '../podcasts/podcastSeries.model.js';
import { VideoEpisodeModel } from '../videos/videoEpisode.model.js';
import { VideoSeriesModel } from '../videos/videoSeries.model.js';
import { BookModel } from '../books/book.model.js';
import { BookChapterModel } from '../books/bookChapter.model.js';
import { ResearchArticleModel } from '../research/research.model.js';
import { LearningPathModel, type LessonTargetType } from './curriculum.model.js';
import { PathProgressModel } from './pathProgress.model.js';
import type {
  CreateLearningPathBody,
  LessonInput,
  ModuleInput,
  UpsertPathProgressBody,
  UpdateLearningPathBody,
} from './curriculum.validation.js';
import type { SetStatusBody } from '../admin/admin.validation.js';

type LessonRow = {
  _id: Types.ObjectId;
  title: string;
  order: number;
  estimatedMinutes?: number | null;
  targetType: LessonTargetType;
  targetRef: Record<string, unknown>;
};

type ModuleRow = {
  _id: Types.ObjectId;
  title: string;
  order: number;
  summary?: string | null;
  lessons: LessonRow[];
};

type PathRow = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  summary: string;
  coverUrl?: string | null;
  language: string;
  authors: string[];
  modules: ModuleRow[];
  status: string;
  rights: { licenseStatus: string; licenseNotes?: string | null };
  publishedAt?: Date | null;
  updatedAt: Date;
};

function assertPublishableRights(licenseStatus: string) {
  if (licenseStatus === 'unknown') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Cannot publish content with unknown license status',
      422,
    );
  }
}

function collectLessons(path: { modules: ModuleRow[] }): LessonRow[] {
  return path.modules.flatMap((module) => module.lessons ?? []);
}

function collectLessonIds(path: { modules: ModuleRow[] }): Set<string> {
  return new Set(collectLessons(path).map((lesson) => lesson._id.toString()));
}

function toPathCard(path: PathRow) {
  return {
    id: path._id.toString(),
    title: path.title,
    slug: path.slug,
    summary: path.summary,
    authors: path.authors,
    language: path.language,
    coverUrl: path.coverUrl ?? null,
    publishedAt: path.publishedAt ?? null,
    moduleCount: path.modules?.length ?? 0,
    lessonCount: collectLessons(path).length,
  };
}

function toAdminPath(path: PathRow) {
  return {
    ...toPathCard(path),
    status: path.status,
    rights: {
      licenseStatus: path.rights.licenseStatus,
      licenseNotes: path.rights.licenseNotes ?? null,
    },
    modules: (path.modules ?? []).map((module) => ({
      id: module._id.toString(),
      title: module.title,
      order: module.order,
      summary: module.summary ?? null,
      lessons: (module.lessons ?? []).map((lesson) => ({
        id: lesson._id.toString(),
        title: lesson.title,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes ?? null,
        targetType: lesson.targetType,
        targetRef: lesson.targetRef,
      })),
    })),
    updatedAt: path.updatedAt,
  };
}

async function resolveLessonTargetLabel(lesson: LessonRow) {
  const ref = lesson.targetRef as Record<string, unknown>;

  switch (lesson.targetType) {
    case 'quran_range': {
      const surahNumber = Number(ref.surahNumber);
      const ayahFrom = Number(ref.ayahFrom);
      const ayahTo = Number(ref.ayahTo);
      const surah = await SurahModel.findOne({ number: surahNumber }).lean();
      return {
        title: surah ? `${surah.nameLatin} ${ayahFrom}-${ayahTo}` : `Surah ${surahNumber}`,
        slug: surah ? String(surah.number) : null,
        href: `/quran/${surahNumber}`,
      };
    }
    case 'podcast_episode': {
      const episode = await PodcastEpisodeModel.findOne({
        _id: String(ref.episodeId),
        ...publicContentFilter(),
      }).lean();
      if (!episode) return { title: null, slug: null, href: null };
      const series = await PodcastSeriesModel.findOne({
        _id: episode.seriesId,
        ...publicContentFilter(),
      }).lean();
      return {
        title: episode.title,
        slug: episode.slug,
        href: series ? `/podcasts/${series.slug}?episode=${episode._id.toString()}` : '/podcasts',
      };
    }
    case 'video_episode': {
      const episode = await VideoEpisodeModel.findOne({
        _id: String(ref.episodeId),
        ...publicContentFilter(),
      }).lean();
      if (!episode) return { title: null, slug: null, href: null };
      const series = await VideoSeriesModel.findOne({
        _id: episode.seriesId,
        ...publicContentFilter(),
      }).lean();
      return {
        title: episode.title,
        slug: episode.slug,
        href: series
          ? `/videos/${series.slug}?episode=${episode._id.toString()}`
          : '/videos',
      };
    }
    case 'book_chapter': {
      const bookId = String(ref.bookId);
      const chapterId = String(ref.chapterId);
      const chapter = await BookChapterModel.findOne({
        _id: chapterId,
        bookId,
        ...publicContentFilter(),
      }).lean();
      if (!chapter) return { title: null, slug: null, href: null };
      const book = await BookModel.findOne({ _id: bookId, ...publicContentFilter() }).lean();
      return {
        title: book ? `${book.title} — ${chapter.title}` : chapter.title,
        slug: chapter.slug,
        href: book ? `/books/${book.slug}/${chapter.slug}` : null,
      };
    }
    case 'research_article': {
      const article = await ResearchArticleModel.findOne({
        _id: String(ref.articleId),
        ...publicContentFilter(),
      }).lean();
      return article
        ? { title: article.title, slug: article.slug, href: `/research/${article.slug}` }
        : { title: null, slug: null, href: null };
    }
    default:
      return { title: null, slug: null, href: null };
  }
}

async function assertLessonTargetPublishable(lesson: LessonInput, indexLabel: string) {
  const ref = lesson.targetRef as Record<string, unknown>;

  switch (lesson.targetType) {
    case 'quran_range': {
      const surahNumber = Number(ref.surahNumber);
      const ayahFrom = Number(ref.ayahFrom);
      const ayahTo = Number(ref.ayahTo);
      if (ayahFrom > ayahTo) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: ayahFrom must be less than or equal to ayahTo`,
          422,
        );
      }
      const surah = await SurahModel.findOne({ number: surahNumber }).lean();
      if (!surah) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: surah ${surahNumber} not found`,
          422,
        );
      }
      const expectedCount = ayahTo - ayahFrom + 1;
      const actualCount = await AyahModel.countDocuments({
        surahNumber,
        ayahNumber: { $gte: ayahFrom, $lte: ayahTo },
      });
      if (actualCount !== expectedCount) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: ayah range ${surahNumber}:${ayahFrom}-${ayahTo} is not fully available`,
          422,
        );
      }
      return;
    }
    case 'podcast_episode': {
      if (!Types.ObjectId.isValid(String(ref.episodeId))) {
        throw new AppError('VALIDATION_ERROR', `${indexLabel}: invalid episodeId`, 422);
      }
      const episode = await PodcastEpisodeModel.findOne({
        _id: ref.episodeId,
        ...publicContentFilter(),
      }).lean();
      if (!episode) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: podcast episode is missing or unpublished`,
          422,
        );
      }
      return;
    }
    case 'video_episode': {
      if (!Types.ObjectId.isValid(String(ref.episodeId))) {
        throw new AppError('VALIDATION_ERROR', `${indexLabel}: invalid episodeId`, 422);
      }
      const episode = await VideoEpisodeModel.findOne({
        _id: ref.episodeId,
        ...publicContentFilter(),
      }).lean();
      if (!episode) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: video episode is missing or unpublished`,
          422,
        );
      }
      return;
    }
    case 'book_chapter': {
      if (
        !Types.ObjectId.isValid(String(ref.bookId)) ||
        !Types.ObjectId.isValid(String(ref.chapterId))
      ) {
        throw new AppError('VALIDATION_ERROR', `${indexLabel}: invalid book/chapter id`, 422);
      }
      const bookId = String(ref.bookId);
      const chapterId = String(ref.chapterId);
      const chapter = await BookChapterModel.findOne({
        _id: chapterId,
        bookId,
        ...publicContentFilter(),
      }).lean();
      if (!chapter) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: book chapter is missing or unpublished`,
          422,
        );
      }
      const book = await BookModel.findOne({ _id: bookId, ...publicContentFilter() }).lean();
      if (!book) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: parent book is missing or unpublished`,
          422,
        );
      }
      return;
    }
    case 'research_article': {
      if (!Types.ObjectId.isValid(String(ref.articleId))) {
        throw new AppError('VALIDATION_ERROR', `${indexLabel}: invalid articleId`, 422);
      }
      const article = await ResearchArticleModel.findOne({
        _id: String(ref.articleId),
        ...publicContentFilter(),
      }).lean();
      if (!article) {
        throw new AppError(
          'VALIDATION_ERROR',
          `${indexLabel}: research article is missing or unpublished`,
          422,
        );
      }
      return;
    }
    default:
      throw new AppError('VALIDATION_ERROR', `${indexLabel}: unsupported target type`, 422);
  }
}

async function assertAllLessonTargetsPublishable(path: { modules: ModuleInput[] }) {
  let lessonIndex = 0;
  for (const module of path.modules ?? []) {
    for (const lesson of module.lessons ?? []) {
      lessonIndex += 1;
      await assertLessonTargetPublishable(lesson, `Lesson ${lessonIndex}`);
    }
  }
  if (lessonIndex === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one lesson is required to publish', 422);
  }
}

function assertLessonIdsBelongToPath(path: PathRow, lessonIds: string[]) {
  const validIds = collectLessonIds(path);
  for (const lessonId of lessonIds) {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new AppError('VALIDATION_ERROR', `Invalid lesson id: ${lessonId}`, 422);
    }
    if (!validIds.has(lessonId)) {
      throw new AppError('VALIDATION_ERROR', `Lesson ${lessonId} does not belong to this path`, 422);
    }
  }
}

export async function listPublishedPaths(input: { page: number; limit: number; q?: string }) {
  const filter: Record<string, unknown> = { ...publicContentFilter() };
  if (input.q) {
    const regex = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { summary: regex }, { authors: regex }];
  }

  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    LearningPathModel.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(input.limit).lean(),
    LearningPathModel.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => toPathCard(row as PathRow)),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function getPublishedPathBySlug(slug: string) {
  const path = await LearningPathModel.findOne({ slug, ...publicContentFilter() }).lean();
  if (!path) throw new AppError('NOT_FOUND', 'Learning path not found', 404);

  const modules = await Promise.all(
    (path.modules ?? []).map(async (module) => ({
      id: module._id.toString(),
      title: module.title,
      order: module.order,
      summary: module.summary ?? null,
      lessons: await Promise.all(
        (module.lessons ?? []).map(async (lesson) => {
          const target = await resolveLessonTargetLabel(lesson as LessonRow);
          return {
            id: lesson._id.toString(),
            title: lesson.title,
            order: lesson.order,
            estimatedMinutes: lesson.estimatedMinutes ?? null,
            targetType: lesson.targetType,
            targetRef: lesson.targetRef,
            targetLabel: target.title,
            targetSlug: target.slug,
            targetHref: target.href,
          };
        }),
      ),
    })),
  );

  return {
    path: {
      ...toPathCard(path as PathRow),
      modules,
    },
    rights: {
      licenseStatus: path.rights.licenseStatus,
      licenseNotes: path.rights.licenseNotes ?? null,
    },
  };
}

export async function listPathProgress(userId: string) {
  const rows = await PathProgressModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  const pathIds = rows.map((row) => row.pathId);
  const paths = await LearningPathModel.find({
    _id: { $in: pathIds },
    ...publicContentFilter(),
  }).lean();
  const pathMap = new Map(paths.map((path) => [path._id.toString(), path]));

  return rows
    .map((row) => {
      const path = pathMap.get(row.pathId.toString());
      if (!path) return null;
      return {
        id: row._id.toString(),
        pathId: row.pathId.toString(),
        path: toPathCard(path as PathRow),
        currentLessonId: row.currentLessonId?.toString() ?? null,
        completedLessonIds: row.completedLessonIds.map((id) => id.toString()),
        updatedAt: row.updatedAt,
      };
    })
    .filter(Boolean);
}

export async function upsertPathProgress(userId: string, input: UpsertPathProgressBody) {
  if (!Types.ObjectId.isValid(input.pathId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid pathId', 422);
  }

  const path = await LearningPathModel.findOne({
    _id: input.pathId,
    ...publicContentFilter(),
  }).lean();
  if (!path) throw new AppError('NOT_FOUND', 'Learning path not found', 404);

  const pathRow = path as PathRow;
  let currentLessonId = input.currentLessonId ?? null;
  let completedLessonIds = input.completedLessonIds ?? [];

  if (input.completeLessonId) {
    assertLessonIdsBelongToPath(pathRow, [input.completeLessonId]);
    const existing = await PathProgressModel.findOne({ userId, pathId: input.pathId }).lean();
    const merged = new Set([
      ...(existing?.completedLessonIds ?? []).map((id) => id.toString()),
      input.completeLessonId,
    ]);
    completedLessonIds = [...merged];
    currentLessonId = input.completeLessonId;
  } else {
    if (currentLessonId) assertLessonIdsBelongToPath(pathRow, [currentLessonId]);
    if (completedLessonIds.length) assertLessonIdsBelongToPath(pathRow, completedLessonIds);
  }

  const row = await PathProgressModel.findOneAndUpdate(
    { userId, pathId: input.pathId },
    {
      userId,
      pathId: input.pathId,
      currentLessonId: currentLessonId ? new Types.ObjectId(currentLessonId) : null,
      completedLessonIds: completedLessonIds.map((id) => new Types.ObjectId(id)),
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return {
    pathId: row!.pathId.toString(),
    currentLessonId: row!.currentLessonId?.toString() ?? null,
    completedLessonIds: row!.completedLessonIds.map((id) => id.toString()),
    updatedAt: row!.updatedAt,
  };
}

// ——— Admin ———

export async function adminListPaths(input: { page: number; limit: number; status?: string }) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (input.status) filter.status = input.status;
  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    LearningPathModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(input.limit).lean(),
    LearningPathModel.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => toAdminPath(row as PathRow)),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function adminCreatePath(userId: string, input: CreateLearningPathBody) {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);

  try {
    const row = await LearningPathModel.create({
      title: input.title,
      slug,
      summary: input.summary,
      coverUrl: input.coverUrl ?? null,
      language: input.language ?? 'uz',
      authors: input.authors,
      modules: input.modules ?? [],
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
      throw new AppError('CONFLICT', 'Learning path slug already exists', 409);
    }
    throw error;
  }
}

export async function adminUpdatePath(userId: string, id: string, input: UpdateLearningPathBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Learning path not found', 404);
  const row = await LearningPathModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Learning path not found', 404);

  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.coverUrl !== undefined) row.coverUrl = input.coverUrl;
  if (input.language !== undefined) row.language = input.language;
  if (input.authors !== undefined) row.authors = input.authors;
  if (input.rights !== undefined) row.rights = input.rights;
  if (input.modules !== undefined) row.set('modules', input.modules);

  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return {
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    status: row.status,
  };
}

export async function adminPublishPath(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Learning path not found', 404);
  const row = await LearningPathModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Learning path not found', 404);

  assertPublishableRights(row.rights.licenseStatus);
  if (!row.authors.length) {
    throw new AppError('VALIDATION_ERROR', 'At least one author is required to publish', 422);
  }
  if (!row.title.trim() || !row.summary.trim()) {
    throw new AppError('VALIDATION_ERROR', 'Path is missing required publish fields', 422);
  }

  await assertAllLessonTargetsPublishable({
    modules: (row.modules ?? []) as ModuleInput[],
  });

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

export async function adminDeletePath(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Learning path not found', 404);
  const row = await LearningPathModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Learning path not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}

export async function adminSetPathStatus(userId: string, id: string, input: SetStatusBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Learning path not found', 404);
  const row = await LearningPathModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Learning path not found', 404);

  assertEditorialStatusTransition(row.status as ContentStatus, input.status);
  row.status = input.status;
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status };
}
