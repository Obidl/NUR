import { Types } from 'mongoose';
import { publicContentFilter } from '../../shared/utils/content.js';
import { getProgress as getQuranProgress, listBookmarks as listQuranBookmarks } from '../quran/quran.service.js';
import { SurahModel } from '../quran/surah.model.js';
import {
  getProgress as getPodcastProgress,
  listFavorites as listPodcastFavorites,
} from '../podcasts/podcast.service.js';
import { PodcastSeriesModel } from '../podcasts/podcastSeries.model.js';
import { PodcastEpisodeModel } from '../podcasts/podcastEpisode.model.js';
import {
  getBookProgress,
  listBookBookmarks,
} from '../books/book.service.js';
import { BookModel } from '../books/book.model.js';
import { BookChapterModel } from '../books/bookChapter.model.js';
import { listResearchBookmarks } from '../research/research.service.js';

const CONTINUE_LIMIT = 5;

function asDate(value: Date | string): number {
  return new Date(value).getTime();
}

export async function getLibraryContinue(userId: string) {
  const [quranRows, podcastRows, bookRows] = await Promise.all([
    getQuranProgress(userId),
    getPodcastProgress(userId),
    getBookProgress(userId),
  ]);

  const surahNumbers = [...new Set(quranRows.map((r) => r.surahNumber))];
  const surahs = await SurahModel.find({ number: { $in: surahNumbers } }).lean();
  const surahMap = new Map(surahs.map((s) => [s.number, s]));

  const quran = [...quranRows]
    .sort((a, b) => asDate(b.updatedAt) - asDate(a.updatedAt))
    .slice(0, CONTINUE_LIMIT)
    .map((row) => {
      const surah = surahMap.get(row.surahNumber);
      return {
        mode: row.mode,
        surahNumber: row.surahNumber,
        ayahNumber: row.ayahNumber,
        surahName: surah?.nameUz ?? surah?.nameLatin ?? `Surah ${row.surahNumber}`,
        updatedAt: row.updatedAt,
      };
    });

  const podcasts = podcastRows
    .filter((row): row is NonNullable<(typeof podcastRows)[number]> => Boolean(row))
    .filter((row) => !row.completed)
    .slice(0, CONTINUE_LIMIT)
    .map((row) => ({
      episodeId: row.episodeId,
      seriesSlug: row.seriesSlug,
      seriesTitle: row.seriesTitle,
      title: row.title,
      positionSeconds: row.positionSeconds,
      durationSeconds: row.durationSeconds,
      coverUrl: row.coverUrl,
      updatedAt: row.updatedAt,
    }));

  const books = bookRows
    .filter((row): row is NonNullable<(typeof bookRows)[number]> => Boolean(row))
    .slice(0, CONTINUE_LIMIT)
    .map((row) => ({
      bookSlug: row.bookSlug,
      chapterSlug: row.chapterSlug,
      title: row.bookTitle,
      chapterTitle: row.chapterTitle,
      coverUrl: row.coverUrl,
      updatedAt: row.updatedAt,
    }));

  return { quran, podcasts, books };
}

export async function getLibraryFavorites(userId: string) {
  const favorites = await listPodcastFavorites(userId);
  const seriesIds = favorites
    .filter((f) => f.targetType === 'series')
    .map((f) => f.targetId)
    .filter((id) => Types.ObjectId.isValid(id));
  const episodeIds = favorites
    .filter((f) => f.targetType === 'episode')
    .map((f) => f.targetId)
    .filter((id) => Types.ObjectId.isValid(id));

  const [seriesRows, episodeRows] = await Promise.all([
    PodcastSeriesModel.find({
      _id: { $in: seriesIds },
      ...publicContentFilter(),
    }).lean(),
    PodcastEpisodeModel.find({
      _id: { $in: episodeIds },
      ...publicContentFilter(),
    }).lean(),
  ]);

  const seriesMap = new Map(seriesRows.map((s) => [s._id.toString(), s]));
  const episodeMap = new Map(episodeRows.map((e) => [e._id.toString(), e]));

  const episodeSeriesIds = [
    ...new Set(episodeRows.map((e) => e.seriesId.toString())),
  ];
  const episodeSeries = await PodcastSeriesModel.find({
    _id: { $in: episodeSeriesIds },
    ...publicContentFilter(),
  }).lean();
  const episodeSeriesMap = new Map(episodeSeries.map((s) => [s._id.toString(), s]));

  const podcasts = favorites
    .map((fav) => {
      if (fav.targetType === 'series') {
        const series = seriesMap.get(fav.targetId);
        if (!series) return null;
        return {
          id: fav.id,
          targetType: 'series' as const,
          targetId: fav.targetId,
          title: series.title,
          slug: series.slug,
          hostOrScholar: series.hostOrScholar,
          coverUrl: series.coverUrl,
          createdAt: fav.createdAt,
        };
      }

      const episode = episodeMap.get(fav.targetId);
      if (!episode) return null;
      const series = episodeSeriesMap.get(episode.seriesId.toString());
      return {
        id: fav.id,
        targetType: 'episode' as const,
        targetId: fav.targetId,
        title: episode.title,
        slug: series?.slug ?? null,
        seriesTitle: series?.title ?? null,
        hostOrScholar: series?.hostOrScholar ?? null,
        coverUrl: episode.coverUrl ?? series?.coverUrl ?? null,
        createdAt: fav.createdAt,
      };
    })
    .filter(Boolean);

  return { podcasts };
}

export async function getLibraryBookmarks(userId: string) {
  const [quran, bookMarks, research] = await Promise.all([
    listQuranBookmarks(userId),
    listBookBookmarks(userId),
    listResearchBookmarks(userId),
  ]);

  const bookIds = bookMarks.map((b) => b.bookId).filter((id) => Types.ObjectId.isValid(id));
  const chapterIds = bookMarks
    .map((b) => b.chapterId)
    .filter((id) => Types.ObjectId.isValid(id));

  const [books, chapters] = await Promise.all([
    BookModel.find({ _id: { $in: bookIds }, ...publicContentFilter() }).lean(),
    BookChapterModel.find({
      _id: { $in: chapterIds },
      ...publicContentFilter(),
    }).lean(),
  ]);
  const bookMap = new Map(books.map((b) => [b._id.toString(), b]));
  const chapterMap = new Map(chapters.map((c) => [c._id.toString(), c]));

  const surahNumbers = [...new Set(quran.map((b) => b.surahNumber))];
  const surahs = await SurahModel.find({ number: { $in: surahNumbers } }).lean();
  const surahMap = new Map(surahs.map((s) => [s.number, s]));

  return {
    quran: quran.map((row) => {
      const surah = surahMap.get(row.surahNumber);
      return {
        id: row.id,
        surahNumber: row.surahNumber,
        ayahNumber: row.ayahNumber,
        surahName: surah?.nameUz ?? surah?.nameLatin ?? `Surah ${row.surahNumber}`,
        note: row.note,
        createdAt: row.createdAt,
      };
    }),
    books: bookMarks
      .map((row) => {
        const book = bookMap.get(row.bookId);
        const chapter = chapterMap.get(row.chapterId);
        if (!book || !chapter) return null;
        return {
          id: row.id,
          bookId: row.bookId,
          chapterId: row.chapterId,
          bookSlug: book.slug,
          chapterSlug: chapter.slug,
          bookTitle: book.title,
          chapterTitle: chapter.title,
          note: row.note,
          createdAt: row.createdAt,
        };
      })
      .filter(Boolean),
    research: research.filter(Boolean),
  };
}
