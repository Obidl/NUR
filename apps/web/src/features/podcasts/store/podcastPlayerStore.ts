import { create } from 'zustand';
import { savePodcastProgress } from '@/features/podcasts/api/podcastApi';

type PodcastPlayerState = {
  episodeId: string | null;
  title: string | null;
  seriesTitle: string | null;
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
  hostOrScholar: null,
  audioUrl: null,
  durationSeconds: 0,
  positionSeconds: 0,
  isPlaying: false,
  playbackRate: 1,

  loadEpisode: (input) =>
    set({
      episodeId: input.episodeId,
      title: input.title,
      seriesTitle: input.seriesTitle,
      hostOrScholar: input.hostOrScholar,
      audioUrl: input.audioUrl,
      durationSeconds: input.durationSeconds,
      positionSeconds: input.positionSeconds ?? 0,
      isPlaying: true,
    }),

  setPlaying: (value) => set({ isPlaying: value }),
  setPosition: (seconds) => set({ positionSeconds: seconds }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  persistProgress: async (accessToken) => {
    const state = get();
    if (!accessToken || !state.episodeId || state.durationSeconds <= 0) return;
    try {
      await savePodcastProgress({
        episodeId: state.episodeId,
        positionSeconds: state.positionSeconds,
        durationSeconds: state.durationSeconds,
        completed: state.positionSeconds >= state.durationSeconds * 0.95,
      });
    } catch {
      // Non-blocking
    }
  },

  stop: () =>
    set({
      episodeId: null,
      title: null,
      seriesTitle: null,
      hostOrScholar: null,
      audioUrl: null,
      durationSeconds: 0,
      positionSeconds: 0,
      isPlaying: false,
    }),
}));
