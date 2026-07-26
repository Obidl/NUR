export type SurahSummary = {
  number: number;
  nameArabic: string;
  nameLatin: string;
  nameUz: string | null;
  ayahCount: number;
  revelationType: 'meccan' | 'medinan' | string;
};

export type AyahSearchHit = {
  surahNumber: number;
  ayahNumber: number;
  textArabic: string;
  textUz: string | null;
  surahName?: string;
};

export type Ayah = {
  surahNumber: number;
  ayahNumber: number;
  textArabic: string;
  textUz: string | null;
  translation: {
    translatorName: string;
    translationKey: string;
  } | null;
};

export type SurahDetail = {
  surah: SurahSummary;
  ayahs: Ayah[];
};

export type Reciter = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photoUrl: string | null;
  audioEdition: string;
  rights: {
    licenseStatus: string;
    licenseNotes: string | null;
  };
};

export type QuranAudioItem = {
  id: string;
  scope: 'ayah' | 'surah';
  surahNumber: number;
  ayahNumber: number | null;
  audioUrl: string;
  bitrateKbps: number | null;
  rights: {
    licenseStatus: string;
    licenseNotes?: string | null;
  };
  reciter: {
    id: string;
    name: string;
    slug: string;
  };
};

export type QuranProgress = {
  mode: 'read' | 'listen';
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  nameArabic?: string | null;
  updatedAt: string;
};

export type QuranBookmark = {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  note: string | null;
  createdAt: string;
};
