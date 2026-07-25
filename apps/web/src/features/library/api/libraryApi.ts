import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  LibraryBookmarks,
  LibraryContinue,
  LibraryFavorites,
  PrimaryContinue,
} from '@/features/library/types/library.types';

export async function fetchLibraryContinue() {
  const { data } = await http.get<{ data: LibraryContinue }>(endpoints.library.continue);
  return data.data;
}

export async function fetchLibraryFavorites() {
  const { data } = await http.get<{ data: LibraryFavorites }>(endpoints.library.favorites);
  return data.data;
}

export async function fetchLibraryBookmarks() {
  const { data } = await http.get<{ data: LibraryBookmarks }>(endpoints.library.bookmarks);
  return data.data;
}

export function pickPrimaryContinue(data: LibraryContinue): PrimaryContinue | null {
  const candidates: PrimaryContinue[] = [];

  for (const item of data.quran) {
    candidates.push({
      kind: 'quran',
      href: `/quran/${item.surahNumber}?ayah=${item.ayahNumber}`,
      label: 'Qur’onni davom ettirish',
      detail: `${item.surahName} · ${item.ayahNumber}-oyat`,
      updatedAt: item.updatedAt,
    });
  }
  for (const item of data.podcasts) {
    candidates.push({
      kind: 'podcast',
      href: `/podcasts/${item.seriesSlug}?episode=${item.episodeId}`,
      label: 'Podcastni davom ettirish',
      detail: item.title,
      updatedAt: item.updatedAt,
    });
  }
  for (const item of data.books) {
    candidates.push({
      kind: 'book',
      href: `/books/${item.bookSlug}/${item.chapterSlug}`,
      label: 'Kitobni davom ettirish',
      detail: `${item.title} · ${item.chapterTitle}`,
      updatedAt: item.updatedAt,
    });
  }

  if (!candidates.length) return null;
  return candidates.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];
}
