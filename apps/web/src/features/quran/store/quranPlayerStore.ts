import { create } from 'zustand';
import { fetchQuranAudio } from '@/features/quran/api/quranApi';

type PlaybackScope = 'ayah' | 'surah';

type QuranPlayerState = {
  reciterId: string | null;
  reciterName: string | null;
  surahNumber: number | null;
  ayahNumber: number | null;
  scope: PlaybackScope | null;
  audioUrl: string | null;
  isPlaying: boolean;
  error: string | null;
  setReciter: (id: string, name: string) => void;
  playAyah: (surahNumber: number, ayahNumber: number) => Promise<void>;
  playSurah: (surahNumber: number) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setPlaying: (value: boolean) => void;
};

export const useQuranPlayerStore = create<QuranPlayerState>((set, get) => ({
  reciterId: null,
  reciterName: null,
  surahNumber: null,
  ayahNumber: null,
  scope: null,
  audioUrl: null,
  isPlaying: false,
  error: null,

  setReciter: (id, name) => set({ reciterId: id, reciterName: name }),

  playAyah: async (surahNumber, ayahNumber) => {
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
        scope: 'ayah',
        audioUrl: item.audioUrl,
        isPlaying: true,
        error: null,
      });
    } catch {
      set({ error: 'Audioni yuklab bo‘lmadi' });
    }
  },

  playSurah: async (surahNumber) => {
    const { reciterId } = get();
    if (!reciterId) {
      set({ error: 'Qori tanlanmagan' });
      return;
    }

    try {
      const items = await fetchQuranAudio({
        reciterId,
        surahNumber,
        scope: 'surah',
      });
      const item = items[0];
      if (!item) {
        set({ error: 'Audio topilmadi' });
        return;
      }
      set({
        surahNumber,
        ayahNumber: 1,
        scope: 'surah',
        audioUrl: item.audioUrl,
        isPlaying: true,
        error: null,
      });
    } catch {
      set({ error: 'Audioni yuklab bo‘lmadi' });
    }
  },

  pause: () => set({ isPlaying: false }),
  stop: () =>
    set({
      audioUrl: null,
      isPlaying: false,
      surahNumber: null,
      ayahNumber: null,
      scope: null,
    }),
  setPlaying: (value) => set({ isPlaying: value }),
}));
