export type SearchHit = {
  type: 'quran' | 'podcasts' | 'videos' | 'books' | 'research';
  title: string;
  slug?: string;
  number?: number;
  snippet: string;
  href: string;
};
