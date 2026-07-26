import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  AyahSearchHit,
  QuranAudioItem,
  QuranBookmark,
  QuranProgress,
  Reciter,
  SurahDetail,
  SurahSummary,
} from '@/features/quran/types/quran.types';

export async function fetchSurahs(q?: string): Promise<SurahSummary[]> {
  const { data } = await http.get<{ data: SurahSummary[] }>(endpoints.quran.surahs, {
    params: q ? { q } : undefined,
  });
  return data.data;
}

export async function fetchSurah(number: number): Promise<SurahDetail> {
  const { data } = await http.get<{ data: SurahDetail }>(endpoints.quran.surah(number));
  return data.data;
}

export async function searchAyahs(q: string, limit = 20): Promise<AyahSearchHit[]> {
  const { data } = await http.get<{ data: AyahSearchHit[] }>(endpoints.quran.search, {
    params: { q, limit },
  });
  return data.data;
}

export async function fetchReciters(): Promise<Reciter[]> {
  const { data } = await http.get<{ data: Reciter[] }>(endpoints.quran.reciters);
  return data.data;
}

export async function fetchQuranAudio(params: {
  reciterId: string;
  surahNumber: number;
  ayahNumber?: number;
  scope?: 'ayah' | 'surah';
}): Promise<QuranAudioItem[]> {
  const { data } = await http.get<{ data: { items: QuranAudioItem[] } }>(endpoints.quran.audio, {
    params,
  });
  return data.data.items;
}

export async function fetchQuranProgress(): Promise<QuranProgress[]> {
  const { data } = await http.get<{ data: QuranProgress[] }>(endpoints.quran.progress);
  return data.data;
}

export async function saveQuranProgress(input: {
  mode: 'read' | 'listen';
  surahNumber: number;
  ayahNumber: number;
}): Promise<QuranProgress> {
  const { data } = await http.put<{ data: QuranProgress }>(endpoints.quran.progress, input);
  return data.data;
}

export async function fetchQuranBookmarks(): Promise<QuranBookmark[]> {
  const { data } = await http.get<{ data: QuranBookmark[] }>(endpoints.quran.bookmarks);
  return data.data;
}

export async function createQuranBookmark(input: {
  surahNumber: number;
  ayahNumber: number;
  note?: string;
}): Promise<QuranBookmark> {
  const { data } = await http.post<{ data: QuranBookmark }>(endpoints.quran.bookmarks, input);
  return data.data;
}

export async function deleteQuranBookmark(id: string): Promise<void> {
  await http.delete(endpoints.quran.bookmark(id));
}
