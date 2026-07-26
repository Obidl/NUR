import { create } from 'zustand';
import { fetchQuranAudio } from '@/features/quran/api/quranApi';

type PlaybackScope = 'ayah' | 'surah';

type QuranPlayerState = {
  reciterId: string | null;
  reciterName: string | null;
  surahNumber: number | null;
  ayahNumber: number | null;
  /** Last ayah in the current surah — used for auto-advance. */
  ayahCount: number | null;
  scope: PlaybackScope | null;
  audioUrl: string | null;
  isPlaying: boolean;
  autoAdvance: boolean;
  error: string | null;
  setReciter: (id: string, name: string) => void;
  playAyah: (
    surahNumber: number,
    ayahNumber: number,
    options?: { ayahCount?: number; autoAdvance?: boolean },
  ) => Promise<void>;
  playSurah: (surahNumber: number, ayahCount: number) => Promise<void>;
  playNextAyah: () => Promise<number | null>;
  pause: () => void;
  stop: () => void;
  setPlaying: (value: boolean) => void;
};

export const useQuranPlayerStore = create<QuranPlayerState>((set, get) => ({
  reciterId: null,
  reciterName: null,
  surahNumber: null,
  ayahNumber: null,
  ayahCount: null,
  scope: null,
  audioUrl: null,
  isPlaying: false,
  autoAdvance: true,
  error: null,

  setReciter: (id, name) => set({ reciterId: id, reciterName: name }),

  playAyah: async (surahNumber, ayahNumber, options) => {
    const { reciterId } = get();
    if (!reciterId) {
      set({ error: 'Qori tanlanmagan' });
      return;
    }

    try {
      const items = await fetchQuranAudio({
        reciterId,
        surahNumber,
        ayahNumber,
        scope: 'ayah',
      });
      const item = items[0];
      if (!item) {
        set({ error: 'Audio topilmadi' });
        return;
      }
      set({
        surahNumber,
        ayahNumber,
        ayahCount: options?.ayahCount ?? get().ayahCount,
        scope: 'ayah',
        audioUrl: item.audioUrl,
        isPlaying: true,
        autoAdvance: options?.autoAdvance ?? true,
        error: null,
      });
    } catch {
      set({ error: 'Audioni yuklab bo‘lmadi' });
    }
  },

  playSurah: async (surahNumber, ayahCount) => {
    // Sequential per-ayah playback so each ayah can highlight as it plays.
    await get().playAyah(surahNumber, 1, { ayahCount, autoAdvance: true });
    set({ scope: 'surah' });
  },

  playNextAyah: async () => {
    const { surahNumber, ayahNumber, ayahCount, autoAdvance } = get();
    if (!autoAdvance || !surahNumber || !ayahNumber || !ayahCount) return null;
    if (ayahNumber >= ayahCount) {
      set({ isPlaying: false });
      return null;
    }
    const next = ayahNumber + 1;
    await get().playAyah(surahNumber, next, { ayahCount, autoAdvance: true });
    return next;
  },

  pause: () => set({ isPlaying: false }),
  stop: () =>
    set({
      audioUrl: null,
      isPlaying: false,
      surahNumber: null,
      ayahNumber: null,
      ayahCount: null,
      scope: null,
      autoAdvance: true,
    }),
  setPlaying: (value) => set({ isPlaying: value }),
}));
