import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type { SearchHit } from '@/features/search/types/search.types';

export async function globalSearch(params: { q: string; types?: string }) {
  const { data } = await http.get<{ data: SearchHit[] }>(endpoints.search, { params });
  return data.data;
}
