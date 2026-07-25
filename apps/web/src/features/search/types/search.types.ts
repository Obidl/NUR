export type SearchHit = {
  type: 'quran' | 'podcasts' | 'books' | 'research';
  title: string;
  slug?: string;
  number?: number;
  snippet: string;
  href: string;
};
