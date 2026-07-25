export type ContentSource = {
  title: string;
  type: 'book' | 'article' | 'scholar' | 'quran' | 'hadith_collection' | 'other';
  citation: string;
  url: string | null;
  notes: string | null;
};

export type ResearchCard = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  authors: string[];
  language: string;
  coverUrl: string | null;
  publishedAt: string | null;
};

export type ResearchArticle = ResearchCard & {
  body: string;
  bodyFormat: 'html' | 'markdown';
  reviewer: string | null;
  sources: ContentSource[];
};

export type ResearchBookmark = {
  id: string;
  articleId: string;
  article?: ResearchCard;
  createdAt: string;
};

export type AdminResearchArticle = ResearchArticle & {
  status: string;
  rights: { licenseStatus: string; licenseNotes: string | null };
  updatedAt: string;
};
