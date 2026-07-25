export type BookCard = {
  id: string;
  title: string;
  slug: string;
  authors: string[];
  translator: string | null;
  description: string;
  coverUrl: string;
  language: string;
  categories: string[];
  publishedAt: string | null;
};

export type BookChapterSummary = {
  id: string;
  title: string;
  slug: string;
  order: number;
  publishedAt: string | null;
};

export type BookChapterDetail = {
  book: {
    id: string;
    title: string;
    slug: string;
    authors: string[];
    translator: string | null;
  };
  chapter: {
    id: string;
    title: string;
    slug: string;
    order: number;
    body: string;
    bodyFormat: 'html' | 'markdown';
    publishedAt: string | null;
  };
};

export type BookProgressItem = {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  coverUrl: string;
  chapterId: string;
  chapterSlug: string;
  chapterTitle: string;
  position: { scrollRatio: number; blockId: string | null };
  updatedAt: string;
};

export type BookBookmark = {
  id: string;
  bookId: string;
  chapterId: string;
  note: string | null;
  createdAt: string;
};

export type BookHighlight = {
  id: string;
  bookId: string;
  chapterId: string;
  selectedText: string;
  note: string | null;
  color: 'lamp' | 'soft';
  createdAt: string;
  updatedAt: string;
};
