import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  PodcastEpisodeDetail,
  PodcastFavorite,
  PodcastProgressItem,
  PodcastSeriesCard,
  PodcastEpisodeSummary,
} from '@/features/podcasts/types/podcast.types';

export async function fetchPodcastSeries(params?: {
  q?: string;
  topic?: string;
  page?: number;
}): Promise<{ items: PodcastSeriesCard[]; total: number }> {
  const { data } = await http.get<{
    data: PodcastSeriesCard[];
    meta: { total: number };
  }>(endpoints.podcasts.series, { params });
  return { items: data.data, total: data.meta.total };
}

export async function fetchPodcastSeriesDetail(slug: string): Promise<{
  series: PodcastSeriesCard;
  episodes: PodcastEpisodeSummary[];
}> {
  const { data } = await http.get<{
    data: { series: PodcastSeriesCard; episodes: PodcastEpisodeSummary[] };
  }>(endpoints.podcasts.seriesDetail(slug));
  return data.data;
}

export async function fetchPodcastEpisode(id: string): Promise<PodcastEpisodeDetail> {
  const { data } = await http.get<{ data: PodcastEpisodeDetail }>(
    endpoints.podcasts.episode(id),
  );
  return data.data;
}

export async function fetchPodcastProgress(): Promise<PodcastProgressItem[]> {
  const { data } = await http.get<{ data: PodcastProgressItem[] }>(
    endpoints.podcasts.progress,
  );
  return data.data;
}

export async function savePodcastProgress(input: {
  episodeId: string;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}): Promise<void> {
  await http.put(endpoints.podcasts.progress, input);
}

export async function fetchPodcastFavorites(): Promise<PodcastFavorite[]> {
  const { data } = await http.get<{ data: PodcastFavorite[] }>(endpoints.podcasts.favorites);
  return data.data;
}

export async function addPodcastFavorite(input: {
  targetType: 'series' | 'episode';
  targetId: string;
}): Promise<PodcastFavorite> {
  const { data } = await http.post<{ data: PodcastFavorite }>(
    endpoints.podcasts.favorites,
    input,
  );
  return data.data;
}

export async function removePodcastFavorite(id: string): Promise<void> {
  await http.delete(endpoints.podcasts.favorite(id));
}
