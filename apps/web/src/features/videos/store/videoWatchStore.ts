import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VideoContinueItem = {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  hostOrScholar: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number | null;
  coverUrl: string | null;
  updatedAt: string;
};

type VideoWatchState = {
  /** Newest first — last watched across series. */
  recent: VideoContinueItem[];
  /** Last episode id per series slug. */
  bySeriesSlug: Record<string, string>;
  markWatched: (item: Omit<VideoContinueItem, 'updatedAt'>) => void;
  lastForSeries: (seriesSlug: string) => string | null;
};

const MAX_RECENT = 12;

export const useVideoWatchStore = create<VideoWatchState>()(
  persist(
    (set, get) => ({
      recent: [],
      bySeriesSlug: {},
      markWatched: (item) => {
        const updatedAt = new Date().toISOString();
        const nextItem: VideoContinueItem = { ...item, updatedAt };
        set((state) => {
          const withoutDup = state.recent.filter(
            (row) => !(row.seriesSlug === item.seriesSlug && row.episodeId === item.episodeId),
          );
          // One continue row per series — newest series first
          const withoutSeries = withoutDup.filter((row) => row.seriesSlug !== item.seriesSlug);
          const recent = [nextItem, ...withoutSeries].slice(0, MAX_RECENT);
          return {
            recent,
            bySeriesSlug: {
              ...state.bySeriesSlug,
              [item.seriesSlug]: item.episodeId,
            },
          };
        });
      },
      lastForSeries: (seriesSlug) => get().bySeriesSlug[seriesSlug] ?? null,
    }),
    { name: 'nur.video.watch' },
  ),
);
