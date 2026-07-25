export type VideoSeriesCard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  hostOrScholar: string;
  coverUrl: string;
  language: string;
  topics: string[];
  channelUrl: string | null;
  publishedAt: string | null;
};

export type VideoEpisodeSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  youtubeVideoId: string;
  embedUrl: string;
  watchUrl: string;
  durationSeconds: number | null;
  episodeNumber: number | null;
  coverUrl: string | null;
  publishedAt: string | null;
};

export type VideoEpisodeDetail = VideoEpisodeSummary & {
  series: VideoSeriesCard;
};
