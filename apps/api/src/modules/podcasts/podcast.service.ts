import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { publicContentFilter, slugify, type ContentStatus } from '../../shared/utils/content.js';
import { assertEditorialStatusTransition } from '../../shared/utils/contentStatus.js';
import { PodcastSeriesModel } from './podcastSeries.model.js';
import { PodcastEpisodeModel } from './podcastEpisode.model.js';
import { PodcastProgressModel } from './podcastProgress.model.js';
import { PodcastFavoriteModel } from './podcastFavorite.model.js';
import type {
  CreateEpisodeBody,
  CreateFavoriteBody,
  CreateSeriesBody,
  UpdateEpisodeBody,
  UpdateSeriesBody,
  UpsertProgressBody,
} from './podcast.validation.js';
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

function toSeriesCard(series: {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  hostOrScholar: string;
  coverUrl: string;
  language: string;
  topics: string[];
  publishedAt?: Date | null;
}) {
  return {
    id: series._id.toString(),
    title: series.title,
    slug: series.slug,
    description: series.description,
    hostOrScholar: series.hostOrScholar,
    coverUrl: series.coverUrl,
    language: series.language,
    topics: series.topics,
    publishedAt: series.publishedAt ?? null,
  };
}

function toEpisodeSummary(episode: {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  durationSeconds: number;
  episodeNumber?: number | null;
  coverUrl?: string | null;
  publishedAt?: Date | null;
}) {
  return {
    id: episode._id.toString(),
    title: episode.title,
    slug: episode.slug,
    description: episode.description,
    durationSeconds: episode.durationSeconds,
    episodeNumber: episode.episodeNumber ?? null,
    coverUrl: episode.coverUrl ?? null,
    publishedAt: episode.publishedAt ?? null,
  };
}

export async function listPublishedSeries(input: {
  page: number;
  limit: number;
  q?: string;
  topic?: string;
}) {
  const filter: Record<string, unknown> = { ...publicContentFilter() };

  if (input.topic) {
    filter.topics = input.topic;
  }
  if (input.q) {
    const regex = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { hostOrScholar: regex }, { description: regex }];
  }

  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    PodcastSeriesModel.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .lean(),
    PodcastSeriesModel.countDocuments(filter),
  ]);

  return {
    items: rows.map(toSeriesCard),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function getPublishedSeriesBySlug(slug: string) {
  const series = await PodcastSeriesModel.findOne({
    slug,
    ...publicContentFilter(),
  }).lean();

  if (!series) {
    throw new AppError('NOT_FOUND', 'Series not found', 404);
  }

  const episodes = await PodcastEpisodeModel.find({
    seriesId: series._id,
    ...publicContentFilter(),
  })
    .sort({ episodeNumber: 1, publishedAt: 1 })
    .lean();

  return {
    series: toSeriesCard(series),
    episodes: episodes.map(toEpisodeSummary),
  };
}

export async function getPublishedEpisodeById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('NOT_FOUND', 'Episode not found', 404);
  }

  const episode = await PodcastEpisodeModel.findOne({
    _id: id,
    ...publicContentFilter(),
  }).lean();

  if (!episode) {
    throw new AppError('NOT_FOUND', 'Episode not found', 404);
  }

  const series = await PodcastSeriesModel.findOne({
    _id: episode.seriesId,
    ...publicContentFilter(),
  }).lean();

  if (!series) {
    throw new AppError('NOT_FOUND', 'Episode not found', 404);
  }

  return {
    id: episode._id.toString(),
    title: episode.title,
    slug: episode.slug,
    description: episode.description,
    audioUrl: episode.audioUrl,
    coverUrl: episode.coverUrl ?? series.coverUrl,
    durationSeconds: episode.durationSeconds,
    episodeNumber: episode.episodeNumber ?? null,
    publishedAt: episode.publishedAt ?? null,
    series: {
      id: series._id.toString(),
      title: series.title,
      slug: series.slug,
      hostOrScholar: series.hostOrScholar,
    },
    rights: {
      licenseStatus: episode.rights.licenseStatus,
      licenseNotes: episode.rights.licenseNotes ?? null,
    },
  };
}

export async function getPublishedEpisodeBySlugs(seriesSlug: string, episodeSlug: string) {
  const series = await PodcastSeriesModel.findOne({
    slug: seriesSlug,
    ...publicContentFilter(),
  }).lean();
  if (!series) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  const episode = await PodcastEpisodeModel.findOne({
    seriesId: series._id,
    slug: episodeSlug,
    ...publicContentFilter(),
  }).lean();
  if (!episode) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  return getPublishedEpisodeById(episode._id.toString());
}

export async function getProgress(userId: string, episodeId?: string) {
  const filter: Record<string, unknown> = { userId };
  if (episodeId) {
    if (!Types.ObjectId.isValid(episodeId)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid episodeId', 422);
    }
    filter.episodeId = episodeId;
  }

  const rows = await PodcastProgressModel.find(filter).sort({ updatedAt: -1 }).lean();

  const episodeIds = rows.map((row) => row.episodeId);
  const episodes = await PodcastEpisodeModel.find({
    _id: { $in: episodeIds },
    ...publicContentFilter(),
  }).lean();
  const episodeMap = new Map(episodes.map((ep) => [ep._id.toString(), ep]));

  const seriesIds = [...new Set(episodes.map((ep) => ep.seriesId.toString()))];
  const seriesRows = await PodcastSeriesModel.find({
    _id: { $in: seriesIds },
    ...publicContentFilter(),
  }).lean();
  const seriesMap = new Map(seriesRows.map((s) => [s._id.toString(), s]));

  return rows
    .map((row) => {
      const episode = episodeMap.get(row.episodeId.toString());
      if (!episode) return null;
      const series = seriesMap.get(episode.seriesId.toString());
      if (!series) return null;
      return {
        episodeId: episode._id.toString(),
        title: episode.title,
        seriesSlug: series.slug,
        seriesTitle: series.title,
        hostOrScholar: series.hostOrScholar,
        coverUrl: episode.coverUrl ?? series.coverUrl,
        positionSeconds: row.positionSeconds,
        durationSeconds: row.durationSeconds,
        completed: row.completed,
        updatedAt: row.updatedAt,
      };
    })
    .filter(Boolean);
}

export async function upsertProgress(userId: string, input: UpsertProgressBody) {
  if (!Types.ObjectId.isValid(input.episodeId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid episodeId', 422);
  }

  const episode = await PodcastEpisodeModel.findOne({
    _id: input.episodeId,
    ...publicContentFilter(),
  }).lean();
  if (!episode) {
    throw new AppError('NOT_FOUND', 'Episode not found', 404);
  }

  const completed =
    input.completed ?? input.positionSeconds >= input.durationSeconds * 0.95;

  const row = await PodcastProgressModel.findOneAndUpdate(
    { userId, episodeId: input.episodeId },
    {
      userId,
      episodeId: input.episodeId,
      positionSeconds: Math.min(input.positionSeconds, input.durationSeconds),
      durationSeconds: input.durationSeconds,
      completed,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return {
    episodeId: row.episodeId.toString(),
    positionSeconds: row.positionSeconds,
    durationSeconds: row.durationSeconds,
    completed: row.completed,
    updatedAt: row.updatedAt,
  };
}

export async function listFavorites(userId: string) {
  const rows = await PodcastFavoriteModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    targetType: row.targetType,
    targetId: row.targetId.toString(),
    createdAt: row.createdAt,
  }));
}

export async function createFavorite(userId: string, input: CreateFavoriteBody) {
  if (!Types.ObjectId.isValid(input.targetId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid targetId', 422);
  }

  if (input.targetType === 'series') {
    const series = await PodcastSeriesModel.findOne({
      _id: input.targetId,
      ...publicContentFilter(),
    }).lean();
    if (!series) throw new AppError('NOT_FOUND', 'Series not found', 404);
  } else {
    const episode = await PodcastEpisodeModel.findOne({
      _id: input.targetId,
      ...publicContentFilter(),
    }).lean();
    if (!episode) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  }

  try {
    const row = await PodcastFavoriteModel.create({
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
    });
    return {
      id: row._id.toString(),
      targetType: row.targetType,
      targetId: row.targetId.toString(),
      createdAt: row.createdAt,
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Already favorited', 409);
    }
    throw error;
  }
}

export async function deleteFavorite(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('NOT_FOUND', 'Favorite not found', 404);
  }
  const deleted = await PodcastFavoriteModel.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new AppError('NOT_FOUND', 'Favorite not found', 404);
  return { success: true };
}

// ——— Admin ———

export async function adminListSeries(input: {
  page: number;
  limit: number;
  status?: string;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (input.status) filter.status = input.status;

  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    PodcastSeriesModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .lean(),
    PodcastSeriesModel.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => ({
      ...toSeriesCard(row),
      status: row.status,
      rights: row.rights,
    })),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function adminCreateSeries(userId: string, input: CreateSeriesBody) {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);

  try {
    const row = await PodcastSeriesModel.create({
      ...input,
      slug,
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
      throw new AppError('CONFLICT', 'Series slug already exists', 409);
    }
    throw error;
  }
}

export async function adminUpdateSeries(
  userId: string,
  id: string,
  input: UpdateSeriesBody,
) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);

  const row = await PodcastSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);

  Object.assign(row, input, { updatedBy: userId });
  if (input.title && !input.slug && row.status === 'draft') {
    row.slug = slugify(input.title) || row.slug;
  }

  try {
    await row.save();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Series slug already exists', 409);
    }
    throw error;
  }

  return { id: row._id.toString(), title: row.title, slug: row.slug, status: row.status };
}

export async function adminPublishSeries(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await PodcastSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);

  assertPublishableRights(row.rights.licenseStatus);
  if (!row.hostOrScholar || !row.coverUrl || !row.description) {
    throw new AppError('VALIDATION_ERROR', 'Series is missing required publish fields', 422);
  }

  row.status = 'published';
  row.publishedAt = row.publishedAt ?? new Date();
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();

  return { id: row._id.toString(), status: row.status, publishedAt: row.publishedAt };
}

export async function adminDeleteSeries(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await PodcastSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}

export async function adminListEpisodes(seriesId: string) {
  if (!Types.ObjectId.isValid(seriesId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid seriesId', 422);
  }
  const series = await PodcastSeriesModel.findOne({ _id: seriesId, deletedAt: null }).lean();
  if (!series) throw new AppError('NOT_FOUND', 'Series not found', 404);

  const rows = await PodcastEpisodeModel.find({
    seriesId,
    deletedAt: null,
  })
    .sort({ episodeNumber: 1, createdAt: 1 })
    .lean();

  return rows.map((row) => ({
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    description: row.description,
    audioUrl: row.audioUrl,
    durationSeconds: row.durationSeconds,
    episodeNumber: row.episodeNumber ?? null,
    status: row.status,
    publishedAt: row.publishedAt,
  }));
}

export async function adminCreateEpisode(userId: string, input: CreateEpisodeBody) {
  if (!Types.ObjectId.isValid(input.seriesId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid seriesId', 422);
  }
  const series = await PodcastSeriesModel.findOne({
    _id: input.seriesId,
    deletedAt: null,
  });
  if (!series) throw new AppError('NOT_FOUND', 'Series not found', 404);

  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);

  try {
    const row = await PodcastEpisodeModel.create({
      ...input,
      slug,
      createdBy: userId,
      status: 'draft',
    });
    return {
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      status: row.status,
      seriesId: row.seriesId.toString(),
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('CONFLICT', 'Episode slug already exists in this series', 409);
    }
    throw error;
  }
}

export async function adminUpdateEpisode(
  userId: string,
  id: string,
  input: UpdateEpisodeBody,
) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  const row = await PodcastEpisodeModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  Object.assign(row, input, { updatedBy: userId });
  await row.save();
  return {
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    status: row.status,
  };
}

export async function adminPublishEpisode(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  const row = await PodcastEpisodeModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  assertPublishableRights(row.rights.licenseStatus);
  if (!row.audioUrl || !row.description || row.durationSeconds < 1) {
    throw new AppError('VALIDATION_ERROR', 'Episode is missing required publish fields', 422);
  }

  const series = await PodcastSeriesModel.findOne({
    _id: row.seriesId,
    deletedAt: null,
  });
  if (!series || series.status !== 'published') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Parent series must be published before publishing an episode',
      422,
    );
  }

  row.status = 'published';
  row.publishedAt = row.publishedAt ?? new Date();
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();

  return { id: row._id.toString(), status: row.status, publishedAt: row.publishedAt };
}

export async function adminDeleteEpisode(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  const row = await PodcastEpisodeModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}

export async function adminSetSeriesStatus(userId: string, id: string, input: SetStatusBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await PodcastSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);
  assertEditorialStatusTransition(row.status as ContentStatus, input.status);
  row.status = input.status;
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status };
}
