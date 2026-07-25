import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  AdminLearningPath,
  AdminPathModule,
  PathCard,
  PathDetail,
  PathProgressItem,
} from '@/features/curriculum/types/curriculum.types';

export async function fetchCurriculumPaths(params?: { q?: string }) {
  const { data } = await http.get<{ data: PathCard[]; meta: { total: number } }>(
    endpoints.curriculum.paths,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function fetchCurriculumPath(slug: string) {
  const { data } = await http.get<{
    data: {
      path: PathDetail;
      rights: { licenseStatus: string; licenseNotes: string | null };
    };
  }>(endpoints.curriculum.path(slug));
  return data.data;
}

export async function fetchCurriculumProgress() {
  const { data } = await http.get<{ data: PathProgressItem[] }>(endpoints.curriculum.progress);
  return data.data;
}

export async function completeCurriculumLesson(pathId: string, completeLessonId: string) {
  const { data } = await http.put<{ data: PathProgressItem }>(endpoints.curriculum.progress, {
    pathId,
    completeLessonId,
  });
  return data.data;
}

export type CreatePathInput = {
  title: string;
  slug?: string;
  summary: string;
  coverUrl?: string | null;
  language?: string;
  authors: string[];
  modules: AdminPathModule[];
  rights: { licenseStatus: string; licenseNotes?: string | null };
};

export async function adminListPaths(params?: { status?: string }) {
  const { data } = await http.get<{ data: AdminLearningPath[]; meta: { total: number } }>(
    endpoints.admin.curriculum.list,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function adminCreatePath(input: CreatePathInput) {
  const { data } = await http.post<{ data: AdminLearningPath }>(
    endpoints.admin.curriculum.list,
    input,
  );
  return data.data;
}

export async function adminUpdatePath(id: string, input: Partial<CreatePathInput>) {
  const { data } = await http.patch<{ data: AdminLearningPath }>(
    endpoints.admin.curriculum.item(id),
    input,
  );
  return data.data;
}

export async function adminPublishPath(id: string) {
  const { data } = await http.post<{ data: { id: string; status: string; publishedAt: string } }>(
    endpoints.admin.curriculum.publish(id),
  );
  return data.data;
}

export async function adminDeletePath(id: string) {
  await http.delete(endpoints.admin.curriculum.item(id));
}
