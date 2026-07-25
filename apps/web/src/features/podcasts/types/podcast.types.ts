export type PodcastSeriesCard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  hostOrScholar: string;
  coverUrl: string;
  language: string;
  topics: string[];
  publishedAt: string | null;
};

export type PodcastEpisodeSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationSeconds: number;
  episodeNumber: number | null;
  coverUrl: string | null;
  publishedAt: string | null;
};

export type PodcastEpisodeDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  durationSeconds: number;
  episodeNumber: number | null;
  publishedAt: string | null;
  series: {
    id: string;
    title: string;
    slug: string;
    hostOrScholar: string;
  };
  rights: {
    licenseStatus: string;
    licenseNotes: string | null;
  };
};

export type PodcastProgressItem = {
  episodeId: string;
  title: string;
  seriesSlug: string;
  seriesTitle: string;
  hostOrScholar: string;
  coverUrl: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
};

export type PodcastFavorite = {
  id: string;
  targetType: 'series' | 'episode';
  targetId: string;
  createdAt: string;
};
