import { create } from 'zustand';
import { savePodcastProgress } from '@/features/podcasts/api/podcastApi';
import { writeLocalPodcastProgress } from '@/features/podcasts/lib/podcastLocalProgress';
import { stopOtherMedia } from '@/shared/lib/mediaSession';

type PodcastPlayerState = {
  episodeId: string | null;
  title: string | null;
  seriesTitle: string | null;
  seriesSlug: string | null;
  hostOrScholar: string | null;
  audioUrl: string | null;
  durationSeconds: number;
  positionSeconds: number;
  isPlaying: boolean;
  playbackRate: number;
  loadEpisode: (input: {
    episodeId: string;
    title: string;
    seriesTitle: string;
    seriesSlug: string;
    hostOrScholar: string;
    audioUrl: string;
    durationSeconds: number;
    positionSeconds?: number;
  }) => void;
  setPlaying: (value: boolean) => void;
  setPosition: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  persistProgress: (accessToken: string | null) => Promise<void>;
  stop: () => void;
};

export const usePodcastPlayerStore = create<PodcastPlayerState>((set, get) => ({
  episodeId: null,
  title: null,
  seriesTitle: null,
  seriesSlug: null,
  hostOrScholar: null,
  audioUrl: null,
  durationSeconds: 0,
  positionSeconds: 0,
  isPlaying: false,
  playbackRate: 1,

  loadEpisode: (input) => {
    void stopOtherMedia('podcast');
    set({
      episodeId: input.episodeId,
      title: input.title,
      seriesTitle: input.seriesTitle,
      seriesSlug: input.seriesSlug,
      hostOrScholar: input.hostOrScholar,
      audioUrl: input.audioUrl,
      durationSeconds: input.durationSeconds,
      positionSeconds: input.positionSeconds ?? 0,
      isPlaying: true,
    });
  },

  setPlaying: (value) => set({ isPlaying: value }),
  setPosition: (seconds) => set({ positionSeconds: seconds }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  persistProgress: async (accessToken) => {
    const state = get();
    if (!state.episodeId || state.durationSeconds <= 0) return;
    const completed = state.positionSeconds >= state.durationSeconds * 0.95;
    writeLocalPodcastProgress({
      episodeId: state.episodeId,
      title: state.title ?? 'Epizod',
      seriesSlug: state.seriesSlug ?? '',
      seriesTitle: state.seriesTitle ?? '',
      hostOrScholar: state.hostOrScholar ?? '',
      positionSeconds: state.positionSeconds,
      durationSeconds: state.durationSeconds,
      completed,
    });
    if (!accessToken) return;
    try {
      await savePodcastProgress({
        episodeId: state.episodeId,
        positionSeconds: state.positionSeconds,
        durationSeconds: state.durationSeconds,
        completed,
      });
    } catch {
      // Non-blocking — local copy already saved
    }
  },

  stop: () =>
    set({
      episodeId: null,
      title: null,
      seriesTitle: null,
      seriesSlug: null,
      hostOrScholar: null,
      audioUrl: null,
      durationSeconds: 0,
      positionSeconds: 0,
      isPlaying: false,
    }),
}));
