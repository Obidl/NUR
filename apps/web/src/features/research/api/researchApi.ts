import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  AdminResearchArticle,
  ContentSource,
  ResearchArticle,
  ResearchBookmark,
  ResearchCard,
} from '@/features/research/types/research.types';

export async function fetchResearch(params?: { q?: string; category?: string; tag?: string }) {
  const { data } = await http.get<{ data: ResearchCard[]; meta: { total: number } }>(
    endpoints.research.list,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function fetchResearchArticle(slug: string) {
  const { data } = await http.get<{
    data: {
      article: ResearchArticle;
      related: ResearchCard[];
      rights: { licenseStatus: string; licenseNotes: string | null };
    };
  }>(endpoints.research.detail(slug));
  return data.data;
}

export async function fetchResearchBookmarks() {
  const { data } = await http.get<{ data: ResearchBookmark[] }>(endpoints.research.bookmarks);
  return data.data;
}

export async function createResearchBookmark(articleId: string) {
  const { data } = await http.post<{ data: ResearchBookmark }>(endpoints.research.bookmarks, {
    articleId,
  });
  return data.data;
}

export async function deleteResearchBookmark(id: string) {
  await http.delete(endpoints.research.bookmark(id));
}

export type CreateResearchInput = {
  title: string;
  slug?: string;
  summary: string;
  body: string;
  bodyFormat?: 'html' | 'markdown';
  category: string;
  tags?: string[];
  authors: string[];
  reviewer?: string | null;
  sources?: ContentSource[];
  language?: string;
  coverUrl?: string | null;
  rights: { licenseStatus: string; licenseNotes?: string | null };
};

export async function adminListResearch(params?: { status?: string }) {
  const { data } = await http.get<{ data: AdminResearchArticle[]; meta: { total: number } }>(
    endpoints.admin.research.list,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function adminCreateResearch(input: CreateResearchInput) {
  const { data } = await http.post<{ data: { id: string; title: string; slug: string; status: string } }>(
    endpoints.admin.research.list,
    input,
  );
  return data.data;
}

export async function adminUpdateResearch(id: string, input: Partial<CreateResearchInput>) {
  const { data } = await http.patch<{ data: { id: string; title: string; slug: string; status: string } }>(
    endpoints.admin.research.item(id),
    input,
  );
  return data.data;
}

export async function adminPublishResearch(id: string) {
  const { data } = await http.post<{ data: { id: string; status: string; publishedAt: string } }>(
    endpoints.admin.research.publish(id),
  );
  return data.data;
}

export async function adminDeleteResearch(id: string) {
  await http.delete(endpoints.admin.research.item(id));
}
