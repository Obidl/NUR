import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { publicContentFilter, slugify, type ContentStatus } from '../../shared/utils/content.js';
import { assertEditorialStatusTransition } from '../../shared/utils/contentStatus.js';
import { VideoSeriesModel } from './videoSeries.model.js';
import { VideoEpisodeModel } from './videoEpisode.model.js';
import type {
  CreateEpisodeBody,
  CreateSeriesBody,
  UpdateEpisodeBody,
  UpdateSeriesBody,
} from './video.validation.js';
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

export function youtubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

function isWeakCoverUrl(url: string | null | undefined) {
  if (!url) return true;
  return /placehold\.co|example\.com|via\.placeholder/i.test(url);
}

function toSeriesCard(
  series: {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    hostOrScholar: string;
    coverUrl: string;
    language: string;
    topics: string[];
    channelUrl?: string | null;
    publishedAt?: Date | null;
  },
  coverOverride?: string | null,
) {
  return {
    id: series._id.toString(),
    title: series.title,
    slug: series.slug,
    description: series.description,
    hostOrScholar: series.hostOrScholar,
    coverUrl: coverOverride && !isWeakCoverUrl(coverOverride) ? coverOverride : series.coverUrl,
    language: series.language,
    topics: series.topics,
    channelUrl: series.channelUrl ?? null,
    publishedAt: series.publishedAt ?? null,
  };
}

async function firstEpisodeThumbBySeriesIds(seriesIds: Types.ObjectId[]) {
  if (seriesIds.length === 0) return new Map<string, string>();
  const episodes = await VideoEpisodeModel.aggregate<{
    _id: Types.ObjectId;
    youtubeVideoId: string;
    coverUrl?: string | null;
  }>([
    {
      $match: {
        seriesId: { $in: seriesIds },
        ...publicContentFilter(),
      },
    },
    { $sort: { episodeNumber: 1, createdAt: 1 } },
    {
      $group: {
        _id: '$seriesId',
        youtubeVideoId: { $first: '$youtubeVideoId' },
        coverUrl: { $first: '$coverUrl' },
      },
    },
  ]);

  const map = new Map<string, string>();
  for (const row of episodes) {
    const thumb =
      row.coverUrl && !isWeakCoverUrl(row.coverUrl)
        ? row.coverUrl
        : youtubeThumbnailUrl(row.youtubeVideoId);
    map.set(row._id.toString(), thumb);
  }
  return map;
}

function toEpisodeSummary(episode: {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  youtubeVideoId: string;
  durationSeconds?: number | null;
  episodeNumber?: number | null;
  coverUrl?: string | null;
  publishedAt?: Date | null;
}) {
  const youtubeVideoId = episode.youtubeVideoId;
  return {
    id: episode._id.toString(),
    title: episode.title,
    slug: episode.slug,
    description: episode.description,
    youtubeVideoId,
    embedUrl: youtubeEmbedUrl(youtubeVideoId),
    watchUrl: youtubeWatchUrl(youtubeVideoId),
    durationSeconds: episode.durationSeconds ?? null,
    episodeNumber: episode.episodeNumber ?? null,
    coverUrl: episode.coverUrl ?? youtubeThumbnailUrl(youtubeVideoId),
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
    VideoSeriesModel.aggregate([
      { $match: filter },
      {
        $addFields: {
          siyratBoost: {
            $cond: [{ $in: ['siyrat', { $ifNull: ['$topics', []] }] }, 0, 1],
          },
        },
      },
      { $sort: { siyratBoost: 1, publishedAt: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: input.limit },
    ]),
    VideoSeriesModel.countDocuments(filter),
  ]);

  const thumbs = await firstEpisodeThumbBySeriesIds(rows.map((row) => row._id));

  return {
    items: rows.map((row) => {
      const weak = isWeakCoverUrl(row.coverUrl);
      const fallback = thumbs.get(row._id.toString()) ?? null;
      return toSeriesCard(row, weak ? fallback : row.coverUrl);
    }),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function getPublishedSeriesBySlug(slug: string) {
  const series = await VideoSeriesModel.findOne({
    slug,
    ...publicContentFilter(),
  }).lean();

  if (!series) {
    throw new AppError('NOT_FOUND', 'Series not found', 404);
  }

  const episodes = await VideoEpisodeModel.find({
    seriesId: series._id,
    ...publicContentFilter(),
  })
    .sort({ episodeNumber: 1, createdAt: 1 })
    .lean();

  const first = episodes[0];
  const coverFallback = first
    ? first.coverUrl && !isWeakCoverUrl(first.coverUrl)
      ? first.coverUrl
      : youtubeThumbnailUrl(first.youtubeVideoId)
    : null;

  return {
    series: toSeriesCard(series, isWeakCoverUrl(series.coverUrl) ? coverFallback : series.coverUrl),
    episodes: episodes.map(toEpisodeSummary),
  };
}

export async function getPublishedEpisodeById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('NOT_FOUND', 'Episode not found', 404);
  }
  const episode = await VideoEpisodeModel.findOne({
    _id: id,
    ...publicContentFilter(),
  }).lean();
  if (!episode) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  const series = await VideoSeriesModel.findOne({
    _id: episode.seriesId,
    ...publicContentFilter(),
  }).lean();
  if (!series) throw new AppError('NOT_FOUND', 'Series not found', 404);

  return {
    ...toEpisodeSummary(episode),
    series: toSeriesCard(series),
  };
}

export async function adminListSeries(input: {
  page: number;
  limit: number;
  status?: ContentStatus;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (input.status) filter.status = input.status;
  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    VideoSeriesModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .lean(),
    VideoSeriesModel.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      status: row.status,
    })),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function adminCreateSeries(userId: string, input: CreateSeriesBody) {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);
  try {
    const row = await VideoSeriesModel.create({
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
      throw new AppError('CONFLICT', 'Series slug already exists', 409);
    }
    throw error;
  }
}

export async function adminUpdateSeries(userId: string, id: string, input: UpdateSeriesBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await VideoSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);
  Object.assign(row, input, { updatedBy: userId });
  await row.save();
  return { id: row._id.toString(), title: row.title, slug: row.slug, status: row.status };
}

export async function adminPublishSeries(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await VideoSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);
  assertPublishableRights(row.rights.licenseStatus);
  if (!row.description || !row.coverUrl || !row.hostOrScholar) {
    throw new AppError('VALIDATION_ERROR', 'Series is missing required publish fields', 422);
  }
  row.status = 'published';
  row.publishedAt = row.publishedAt ?? new Date();
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status, publishedAt: row.publishedAt };
}

export async function adminSetSeriesStatus(userId: string, id: string, input: SetStatusBody) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await VideoSeriesModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Series not found', 404);
  assertEditorialStatusTransition(row.status as ContentStatus, input.status);
  row.status = input.status;
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { id: row._id.toString(), status: row.status };
}

export async function adminDeleteSeries(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Series not found', 404);
  const row = await VideoSeriesModel.findOne({ _id: id, deletedAt: null });
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
  const series = await VideoSeriesModel.findOne({ _id: seriesId, deletedAt: null }).lean();
  if (!series) throw new AppError('NOT_FOUND', 'Series not found', 404);

  const rows = await VideoEpisodeModel.find({ seriesId, deletedAt: null })
    .sort({ episodeNumber: 1, createdAt: 1 })
    .lean();

  return rows.map((row) => ({
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    description: row.description,
    youtubeVideoId: row.youtubeVideoId,
    embedUrl: youtubeEmbedUrl(row.youtubeVideoId),
    watchUrl: youtubeWatchUrl(row.youtubeVideoId),
    coverUrl: row.coverUrl ?? youtubeThumbnailUrl(row.youtubeVideoId),
    durationSeconds: row.durationSeconds ?? null,
    episodeNumber: row.episodeNumber ?? null,
    status: row.status,
    publishedAt: row.publishedAt,
  }));
}

export async function adminCreateEpisode(userId: string, input: CreateEpisodeBody) {
  if (!Types.ObjectId.isValid(input.seriesId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid seriesId', 422);
  }
  const series = await VideoSeriesModel.findOne({ _id: input.seriesId, deletedAt: null });
  if (!series) throw new AppError('NOT_FOUND', 'Series not found', 404);

  const slug = input.slug ?? slugify(input.title);
  if (!slug) throw new AppError('VALIDATION_ERROR', 'Invalid slug', 422);
  const coverUrl = input.coverUrl ?? youtubeThumbnailUrl(input.youtubeVideoId);

  try {
    const row = await VideoEpisodeModel.create({
      seriesId: input.seriesId,
      title: input.title,
      slug,
      description: input.description,
      youtubeVideoId: input.youtubeVideoId,
      coverUrl,
      durationSeconds: input.durationSeconds ?? null,
      episodeNumber: input.episodeNumber ?? null,
      rights: input.rights,
      createdBy: userId,
      status: 'draft',
    });
    return {
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      status: row.status,
      seriesId: row.seriesId.toString(),
      youtubeVideoId: row.youtubeVideoId,
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
  const row = await VideoEpisodeModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.description !== undefined) row.description = input.description;
  if (input.youtubeVideoId !== undefined) {
    row.youtubeVideoId = input.youtubeVideoId;
    if (!input.coverUrl) row.coverUrl = youtubeThumbnailUrl(input.youtubeVideoId);
  }
  if (input.coverUrl !== undefined) row.coverUrl = input.coverUrl;
  if (input.durationSeconds !== undefined) row.durationSeconds = input.durationSeconds;
  if (input.episodeNumber !== undefined) row.episodeNumber = input.episodeNumber;
  if (input.rights !== undefined) row.rights = input.rights;
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return {
    id: row._id.toString(),
    title: row.title,
    slug: row.slug,
    status: row.status,
    youtubeVideoId: row.youtubeVideoId,
  };
}

export async function adminPublishEpisode(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  const row = await VideoEpisodeModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Episode not found', 404);

  assertPublishableRights(row.rights.licenseStatus);
  if (!row.youtubeVideoId || !row.description) {
    throw new AppError('VALIDATION_ERROR', 'Episode is missing required publish fields', 422);
  }

  const series = await VideoSeriesModel.findOne({ _id: row.seriesId, deletedAt: null });
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
  const row = await VideoEpisodeModel.findOne({ _id: id, deletedAt: null });
  if (!row) throw new AppError('NOT_FOUND', 'Episode not found', 404);
  row.deletedAt = new Date();
  row.status = 'archived';
  row.updatedBy = new Types.ObjectId(userId);
  await row.save();
  return { success: true };
}
