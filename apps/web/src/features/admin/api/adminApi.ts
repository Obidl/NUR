import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';

export type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type EditorialStatus = 'draft' | 'in_review' | 'archived';

export type AdminContentCard = {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'editor' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function adminListPodcastSeries(params?: { status?: string }) {
  const { data } = await http.get<{ data: AdminContentCard[]; meta: { total: number } }>(
    endpoints.admin.podcasts.series,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function adminCreatePodcastSeries(input: {
  title: string;
  description: string;
  hostOrScholar: string;
  coverUrl: string;
  rights: { licenseStatus: string; licenseNotes?: string | null };
}) {
  const { data } = await http.post<{ data: AdminContentCard }>(
    endpoints.admin.podcasts.series,
    input,
  );
  return data.data;
}

export async function adminPublishPodcastSeries(id: string) {
  await http.post(endpoints.admin.podcasts.publishSeries(id));
}

export async function adminSetPodcastSeriesStatus(id: string, status: EditorialStatus) {
  await http.post(endpoints.admin.podcasts.statusSeries(id), { status });
}

export async function adminDeletePodcastSeries(id: string) {
  await http.delete(endpoints.admin.podcasts.itemSeries(id));
}

export async function adminUpdatePodcastEpisode(
  id: string,
  input: { audioUrl?: string; title?: string; description?: string },
) {
  const { data } = await http.patch<{ data: { id: string; audioUrl?: string } }>(
    endpoints.admin.podcasts.episode(id),
    input,
  );
  return data.data;
}

export type AdminEpisodeRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  audioUrl: string;
  durationSeconds: number;
  episodeNumber: number | null;
  status: ContentStatus;
  publishedAt: string | null;
};

export async function adminListPodcastEpisodes(seriesId: string) {
  const { data } = await http.get<{ data: AdminEpisodeRow[] }>(
    endpoints.admin.podcasts.seriesEpisodes(seriesId),
  );
  return data.data;
}

export async function adminCreatePodcastEpisode(input: {
  seriesId: string;
  title: string;
  description: string;
  audioUrl: string;
  durationSeconds: number;
  episodeNumber?: number | null;
  coverUrl?: string | null;
  rights: { licenseStatus: string; licenseNotes?: string | null };
}) {
  const { data } = await http.post<{
    data: { id: string; title: string; slug: string; status: ContentStatus; seriesId: string };
  }>(endpoints.admin.podcasts.episodes, input);
  return data.data;
}

export async function adminPublishPodcastEpisode(id: string) {
  await http.post(endpoints.admin.podcasts.publishEpisode(id));
}

export async function adminListVideoSeries(params?: { status?: string }) {
  const { data } = await http.get<{ data: AdminContentCard[]; meta: { total: number } }>(
    endpoints.admin.videos.series,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function adminCreateVideoSeries(input: {
  title: string;
  description: string;
  hostOrScholar: string;
  coverUrl: string;
  channelUrl?: string | null;
  topics?: string[];
  rights: { licenseStatus: string; licenseNotes?: string | null };
}) {
  const { data } = await http.post<{ data: AdminContentCard }>(
    endpoints.admin.videos.series,
    input,
  );
  return data.data;
}

export async function adminPublishVideoSeries(id: string) {
  await http.post(endpoints.admin.videos.publishSeries(id));
}

export async function adminSetVideoSeriesStatus(id: string, status: EditorialStatus) {
  await http.post(endpoints.admin.videos.statusSeries(id), { status });
}

export async function adminDeleteVideoSeries(id: string) {
  await http.delete(endpoints.admin.videos.itemSeries(id));
}

export type AdminVideoEpisodeRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  youtubeVideoId: string;
  embedUrl: string;
  watchUrl: string;
  coverUrl: string | null;
  durationSeconds: number | null;
  episodeNumber: number | null;
  status: ContentStatus;
  publishedAt: string | null;
};

export async function adminListVideoEpisodes(seriesId: string) {
  const { data } = await http.get<{ data: AdminVideoEpisodeRow[] }>(
    endpoints.admin.videos.seriesEpisodes(seriesId),
  );
  return data.data;
}

export async function adminCreateVideoEpisode(input: {
  seriesId: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  episodeNumber?: number | null;
  coverUrl?: string | null;
  rights: { licenseStatus: string; licenseNotes?: string | null };
}) {
  const { data } = await http.post<{
    data: {
      id: string;
      title: string;
      slug: string;
      status: ContentStatus;
      seriesId: string;
      youtubeVideoId: string;
    };
  }>(endpoints.admin.videos.episodes, input);
  return data.data;
}

export async function adminUpdateVideoEpisode(
  id: string,
  input: { youtubeVideoId?: string; title?: string; description?: string },
) {
  const { data } = await http.patch<{ data: { id: string; youtubeVideoId?: string } }>(
    endpoints.admin.videos.episode(id),
    input,
  );
  return data.data;
}

export async function adminPublishVideoEpisode(id: string) {
  await http.post(endpoints.admin.videos.publishEpisode(id));
}

export async function adminListBooks(params?: { status?: string }) {
  const { data } = await http.get<{ data: AdminContentCard[]; meta: { total: number } }>(
    endpoints.admin.books.list,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function adminCreateBook(input: {
  title: string;
  authors: string[];
  description: string;
  coverUrl: string;
  rights: { licenseStatus: string; licenseNotes?: string | null };
}) {
  const { data } = await http.post<{ data: AdminContentCard }>(endpoints.admin.books.list, input);
  return data.data;
}

export async function adminPublishBook(id: string) {
  await http.post(endpoints.admin.books.publish(id));
}

export async function adminSetBookStatus(id: string, status: EditorialStatus) {
  await http.post(endpoints.admin.books.status(id), { status });
}

export async function adminDeleteBook(id: string) {
  await http.delete(endpoints.admin.books.item(id));
}

export type AdminChapterRow = {
  id: string;
  title: string;
  slug: string;
  order: number;
  body: string;
  bodyFormat: 'html' | 'markdown';
  status: ContentStatus;
  publishedAt: string | null;
};

export async function adminListBookChapters(bookId: string) {
  const { data } = await http.get<{ data: AdminChapterRow[] }>(
    endpoints.admin.books.bookChapters(bookId),
  );
  return data.data;
}

export async function adminCreateBookChapter(input: {
  bookId: string;
  title: string;
  order: number;
  body: string;
  bodyFormat?: 'html' | 'markdown';
}) {
  const { data } = await http.post<{
    data: { id: string; title: string; slug: string; status: ContentStatus; bookId: string };
  }>(endpoints.admin.books.chapters, input);
  return data.data;
}

export async function adminUpdateBookChapter(
  id: string,
  input: { title?: string; order?: number; body?: string; bodyFormat?: 'html' | 'markdown' },
) {
  const { data } = await http.patch<{
    data: { id: string; title: string; slug: string; status: ContentStatus };
  }>(endpoints.admin.books.chapter(id), input);
  return data.data;
}

export async function adminPublishBookChapter(id: string) {
  await http.post(endpoints.admin.books.publishChapter(id));
}

export async function adminSetResearchStatus(id: string, status: EditorialStatus) {
  await http.post(endpoints.admin.research.status(id), { status });
}

export async function adminSetCurriculumStatus(id: string, status: EditorialStatus) {
  await http.post(endpoints.admin.curriculum.status(id), { status });
}

export async function adminListUsers(params?: { q?: string; role?: string }) {
  const { data } = await http.get<{ data: AdminUser[]; meta: { total: number } }>(
    endpoints.admin.users.list,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function adminUpdateUserRole(id: string, role: AdminUser['role']) {
  const { data } = await http.patch<{ data: AdminUser }>(endpoints.admin.users.role(id), { role });
  return data.data;
}

export async function adminUpdateUserStatus(id: string, isActive: boolean) {
  const { data } = await http.patch<{ data: AdminUser }>(endpoints.admin.users.status(id), {
    isActive,
  });
  return data.data;
}
