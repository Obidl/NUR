import { publicContentFilter } from '../../shared/utils/content.js';
import { SurahModel } from '../quran/surah.model.js';
import { PodcastSeriesModel } from '../podcasts/podcastSeries.model.js';
import { VideoSeriesModel } from '../videos/videoSeries.model.js';
import { BookModel } from '../books/book.model.js';
import { ResearchArticleModel } from '../research/research.model.js';
import type { SearchQuery } from './search.validation.js';

export type SearchHit = {
  type: 'quran' | 'podcasts' | 'videos' | 'books' | 'research';
  title: string;
  slug?: string;
  number?: number;
  snippet: string;
  href: string;
};

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function snippetFrom(text: string, max = 140) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

async function searchQuran(q: string, limit: number): Promise<SearchHit[]> {
  const trimmed = q.trim();
  const asNumber = Number(trimmed);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 114) {
    const surah = await SurahModel.findOne({ number: asNumber }).lean();
    if (!surah) return [];
    return [
      {
        type: 'quran',
        title: surah.nameUz ?? surah.nameLatin,
        number: surah.number,
        snippet: `${surah.nameArabic} · ${surah.ayahCount} oyat`,
        href: `/quran/${surah.number}`,
      },
    ];
  }

  const regex = new RegExp(escapeRegex(trimmed), 'i');
  const rows = await SurahModel.find({
    $or: [{ nameLatin: regex }, { nameArabic: regex }, { nameUz: regex }],
  })
    .sort({ number: 1 })
    .limit(limit)
    .lean();

  return rows.map((surah) => ({
    type: 'quran' as const,
    title: surah.nameUz ?? surah.nameLatin,
    number: surah.number,
    snippet: `${surah.nameArabic} · ${surah.ayahCount} oyat`,
    href: `/quran/${surah.number}`,
  }));
}

async function searchPodcasts(q: string, limit: number): Promise<SearchHit[]> {
  const regex = new RegExp(escapeRegex(q), 'i');
  const rows = await PodcastSeriesModel.find({
    ...publicContentFilter(),
    $or: [{ title: regex }, { description: regex }, { hostOrScholar: regex }, { topics: regex }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((row) => ({
    type: 'podcasts' as const,
    title: row.title,
    slug: row.slug,
    snippet: snippetFrom(`${row.hostOrScholar} — ${row.description}`),
    href: `/podcasts/${row.slug}`,
  }));
}

async function searchBooks(q: string, limit: number): Promise<SearchHit[]> {
  const regex = new RegExp(escapeRegex(q), 'i');
  const rows = await BookModel.find({
    ...publicContentFilter(),
    $or: [{ title: regex }, { authors: regex }, { description: regex }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((row) => ({
    type: 'books' as const,
    title: row.title,
    slug: row.slug,
    snippet: snippetFrom(`${row.authors.join(', ')} — ${row.description}`),
    href: `/books/${row.slug}`,
  }));
}

async function searchVideos(q: string, limit: number): Promise<SearchHit[]> {
  const regex = new RegExp(escapeRegex(q), 'i');
  const rows = await VideoSeriesModel.find({
    ...publicContentFilter(),
    $or: [{ title: regex }, { description: regex }, { hostOrScholar: regex }, { topics: regex }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((row) => ({
    type: 'videos' as const,
    title: row.title,
    slug: row.slug,
    snippet: snippetFrom(`${row.hostOrScholar} — ${row.description}`),
    href: `/videos/${row.slug}`,
  }));
}

async function searchResearch(q: string, limit: number): Promise<SearchHit[]> {
  const regex = new RegExp(escapeRegex(q), 'i');
  const rows = await ResearchArticleModel.find({
    ...publicContentFilter(),
    $or: [{ title: regex }, { summary: regex }, { authors: regex }, { tags: regex }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((row) => ({
    type: 'research' as const,
    title: row.title,
    slug: row.slug,
    snippet: snippetFrom(row.summary),
    href: `/research/${row.slug}`,
  }));
}

export async function globalSearch(input: SearchQuery) {
  const types = input.types;
  const limit = input.limit;
  const q = input.q;

  const tasks: Array<Promise<SearchHit[]>> = [];
  if (types.includes('quran')) tasks.push(searchQuran(q, limit));
  if (types.includes('podcasts')) tasks.push(searchPodcasts(q, limit));
  if (types.includes('videos')) tasks.push(searchVideos(q, limit));
  if (types.includes('books')) tasks.push(searchBooks(q, limit));
  if (types.includes('research')) tasks.push(searchResearch(q, limit));

  const groups = await Promise.all(tasks);
  return groups.flat();
}
