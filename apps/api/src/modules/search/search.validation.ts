import { z } from 'zod';

const SEARCH_TYPES = ['quran', 'podcasts', 'videos', 'books', 'research'] as const;
type SearchType = (typeof SEARCH_TYPES)[number];

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100),
    types: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(8),
  })
  .superRefine((data, ctx) => {
    if (!data.types) return;
    const parts = data.types
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const invalid = parts.filter((p) => !(SEARCH_TYPES as readonly string[]).includes(p));
    if (invalid.length > 0 || parts.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['types'],
        message: 'types must be CSV of quran,podcasts,videos,books,research',
      });
    }
  })
  .transform((data) => {
    const types: SearchType[] = data.types
      ? (data.types
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean) as SearchType[])
      : [...SEARCH_TYPES];

    return {
      q: data.q,
      limit: data.limit,
      types,
    };
  });

export type SearchQuery = {
  q: string;
  limit: number;
  types: SearchType[];
};
