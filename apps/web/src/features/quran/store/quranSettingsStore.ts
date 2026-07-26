import { create } from 'zustand';

const FONT_KEY = 'nur_quran_font_size';
const SHOW_TRANSLATION_KEY = 'nur_quran_show_translation';
const THEME_KEY = 'nur_quran_reader_theme';

export type QuranReaderTheme = 'parchment' | 'mist' | 'night';

type QuranSettingsState = {
  fontSize: number;
  showTranslation: boolean;
  readerTheme: QuranReaderTheme;
  setFontSize: (size: number) => void;
  setShowTranslation: (value: boolean) => void;
  setReaderTheme: (theme: QuranReaderTheme) => void;
  hydrateFromUserPreference: (fontSize?: number) => void;
};

function readFontSize(): number {
  if (typeof localStorage === 'undefined') return 28;
  const raw = localStorage.getItem(FONT_KEY);
  const parsed = raw ? Number(raw) : 28;
  if (!Number.isFinite(parsed)) return 28;
  return Math.min(40, Math.max(16, parsed));
}

function readTheme(): QuranReaderTheme {
  if (typeof localStorage === 'undefined') return 'parchment';
  const raw = localStorage.getItem(THEME_KEY);
  if (raw === 'mist' || raw === 'night' || raw === 'parchment') return raw;
  return 'parchment';
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
  readerTheme: readTheme(),

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

  setReaderTheme: (theme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, theme);
    }
    set({ readerTheme: theme });
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
