export type LibraryContinue = {
  quran: Array<{
    mode: 'read' | 'listen';
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    updatedAt: string;
  }>;
  podcasts: Array<{
    episodeId: string;
    seriesSlug: string;
    seriesTitle: string;
    title: string;
    positionSeconds: number;
    durationSeconds: number;
    coverUrl: string | null;
    updatedAt: string;
  }>;
  videos: Array<{
    episodeId: string;
    seriesSlug: string;
    seriesTitle: string;
    title: string;
    episodeNumber: number | null;
    hostOrScholar: string;
    coverUrl: string | null;
    completed: boolean;
    updatedAt: string;
  }>;
  books: Array<{
    bookSlug: string;
    chapterSlug: string;
    title: string;
    chapterTitle: string;
    coverUrl: string;
    updatedAt: string;
  }>;
};

export type LibraryFavorites = {
  podcasts: Array<{
    id: string;
    targetType: 'series' | 'episode';
    targetId: string;
    title: string;
    slug: string | null;
    seriesTitle?: string | null;
    hostOrScholar: string | null;
    coverUrl: string | null;
    createdAt: string;
  }>;
};

export type LibraryBookmarks = {
  quran: Array<{
    id: string;
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    note: string | null;
    createdAt: string;
  }>;
  books: Array<{
    id: string;
    bookId: string;
    chapterId: string;
    bookSlug: string;
    chapterSlug: string;
    bookTitle: string;
    chapterTitle: string;
    note: string | null;
    createdAt: string;
  }>;
  research: Array<{
    id: string;
    articleId: string;
    article: {
      id: string;
      title: string;
      slug: string;
      summary: string;
      category: string;
      authors: string[];
    };
    createdAt: string;
  }>;
};

export type PrimaryContinue =
  | { kind: 'quran'; href: string; label: string; detail: string; updatedAt: string }
  | { kind: 'podcast'; href: string; label: string; detail: string; updatedAt: string }
  | { kind: 'video'; href: string; label: string; detail: string; updatedAt: string }
  | { kind: 'book'; href: string; label: string; detail: string; updatedAt: string };
