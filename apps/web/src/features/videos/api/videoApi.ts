import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  VideoEpisodeDetail,
  VideoEpisodeSummary,
  VideoProgressItem,
  VideoSeriesCard,
} from '@/features/videos/types/video.types';

export async function fetchVideoSeries(params?: {
  q?: string;
  topic?: string;
  limit?: number;
}) {
  const { data } = await http.get<{ data: VideoSeriesCard[]; meta: { total: number } }>(
    endpoints.videos.series,
    { params },
  );
  return { items: data.data, total: data.meta.total };
}

export async function fetchVideoSeriesDetail(slug: string) {
  const { data } = await http.get<{
    data: { series: VideoSeriesCard; episodes: VideoEpisodeSummary[] };
  }>(endpoints.videos.seriesDetail(slug));
  return data.data;
}

export async function fetchVideoEpisode(id: string) {
  const { data } = await http.get<{ data: VideoEpisodeDetail }>(endpoints.videos.episode(id));
  return data.data;
}

export async function fetchVideoProgress(): Promise<VideoProgressItem[]> {
  const { data } = await http.get<{ data: VideoProgressItem[] }>(endpoints.videos.progress);
  return data.data;
}

export async function saveVideoProgress(input: {
  episodeId: string;
  completed?: boolean;
}): Promise<void> {
  await http.put(endpoints.videos.progress, input);
}
