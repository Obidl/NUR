export type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived';

export const CONTENT_STATUSES: ContentStatus[] = [
  'draft',
  'in_review',
  'published',
  'archived',
];

export function publicContentFilter() {
  return {
    status: 'published' as const,
    deletedAt: null,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
