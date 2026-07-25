import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  BookBookmark,
  BookCard,
  BookChapterDetail,
  BookChapterSummary,
  BookHighlight,
  BookProgressItem,
} from '@/features/books/types/book.types';

export async function fetchBooks(params?: { q?: string; category?: string }) {
  const { data } = await http.get<{ data: BookCard[]; meta: { total: number } }>(
    endpoints.books.list,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function fetchBook(slug: string) {
  const { data } = await http.get<{
    data: {
      book: BookCard;
      chapters: BookChapterSummary[];
      rights: { licenseStatus: string; licenseNotes: string | null };
    };
  }>(endpoints.books.detail(slug));
  return data.data;
}

export async function fetchChapter(slug: string, chapterSlug: string) {
  const { data } = await http.get<{ data: BookChapterDetail }>(
    endpoints.books.chapter(slug, chapterSlug),
  );
  return data.data;
}

export async function fetchBookProgress() {
  const { data } = await http.get<{ data: BookProgressItem[] }>(endpoints.books.progress);
  return data.data;
}

export async function saveBookProgress(input: {
  bookId: string;
  chapterId: string;
  position: { scrollRatio?: number; blockId?: string | null };
}) {
  await http.put(endpoints.books.progress, input);
}

export async function fetchBookBookmarks() {
  const { data } = await http.get<{ data: BookBookmark[] }>(endpoints.books.bookmarks);
  return data.data;
}

export async function createBookBookmark(input: {
  bookId: string;
  chapterId: string;
  note?: string;
}) {
  const { data } = await http.post<{ data: BookBookmark }>(endpoints.books.bookmarks, input);
  return data.data;
}

export async function deleteBookBookmark(id: string) {
  await http.delete(endpoints.books.bookmark(id));
}

export async function fetchBookHighlights(params?: { chapterId?: string; bookId?: string }) {
  const { data } = await http.get<{ data: BookHighlight[] }>(endpoints.books.highlights, {
    params,
  });
  return data.data;
}

export async function createBookHighlight(input: {
  bookId: string;
  chapterId: string;
  selectedText: string;
  note?: string | null;
  color?: 'lamp' | 'soft';
}) {
  const { data } = await http.post<{ data: BookHighlight }>(endpoints.books.highlights, input);
  return data.data;
}

export async function updateBookHighlight(
  id: string,
  input: { note?: string | null; color?: 'lamp' | 'soft' },
) {
  const { data } = await http.patch<{ data: BookHighlight }>(endpoints.books.highlight(id), input);
  return data.data;
}

export async function deleteBookHighlight(id: string) {
  await http.delete(endpoints.books.highlight(id));
}
