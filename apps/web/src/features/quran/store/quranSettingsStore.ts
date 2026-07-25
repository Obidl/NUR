import { create } from 'zustand';

const FONT_KEY = 'nur_quran_font_size';
const SHOW_TRANSLATION_KEY = 'nur_quran_show_translation';

type QuranSettingsState = {
  fontSize: number;
  showTranslation: boolean;
  setFontSize: (size: number) => void;
  setShowTranslation: (value: boolean) => void;
  hydrateFromUserPreference: (fontSize?: number) => void;
};

function readFontSize(): number {
  if (typeof localStorage === 'undefined') return 28;
  const raw = localStorage.getItem(FONT_KEY);
  const parsed = raw ? Number(raw) : 28;
  if (!Number.isFinite(parsed)) return 28;
  return Math.min(40, Math.max(16, parsed));
}

function applyFontSizeCss(size: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--quran-font-size', `${size}px`);
}

export const useQuranSettingsStore = create<QuranSettingsState>((set) => ({
  fontSize: readFontSize(),
  showTranslation:
    typeof localStorage === 'undefined'
      ? true
      : localStorage.getItem(SHOW_TRANSLATION_KEY) !== 'false',

  setFontSize: (size) => {
    const next = Math.min(40, Math.max(16, size));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FONT_KEY, String(next));
    }
    applyFontSizeCss(next);
    set({ fontSize: next });
  },

  setShowTranslation: (value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SHOW_TRANSLATION_KEY, String(value));
    }
    set({ showTranslation: value });
  },

  hydrateFromUserPreference: (fontSize) => {
    if (typeof fontSize === 'number') {
      const next = Math.min(40, Math.max(16, fontSize));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FONT_KEY, String(next));
      }
      applyFontSizeCss(next);
      set({ fontSize: next });
    }
  },
}));

applyFontSizeCss(readFontSize());
