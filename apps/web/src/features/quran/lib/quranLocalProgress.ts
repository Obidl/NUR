import type { QuranProgress } from '@/features/quran/types/quran.types';
import { fetchQuranProgress, saveQuranProgress } from '@/features/quran/api/quranApi';

const STORAGE_KEY = 'nur_quran_local_progress';

export type LocalQuranProgress = Pick<
  QuranProgress,
  'mode' | 'surahNumber' | 'ayahNumber' | 'surahName' | 'nameArabic' | 'updatedAt'
>;

export function readLocalQuranProgress(): LocalQuranProgress | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalQuranProgress;
    if (
      !parsed ||
      (parsed.mode !== 'read' && parsed.mode !== 'listen') ||
      !Number.isInteger(parsed.surahNumber) ||
      !Number.isInteger(parsed.ayahNumber)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalQuranProgress(input: {
  mode: 'read' | 'listen';
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  nameArabic?: string | null;
}): void {
  if (typeof localStorage === 'undefined') return;
  const payload: LocalQuranProgress = {
    mode: input.mode,
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
    surahName: input.surahName,
    nameArabic: input.nameArabic ?? null,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** Push device progress to the server when it is newer or server has none. */
export async function syncLocalQuranProgressToServer(): Promise<void> {
  const local = readLocalQuranProgress();
  if (!local) return;

  try {
    const rows = await fetchQuranProgress();
    const server = rows.find((row) => row.mode === local.mode) ?? rows[0] ?? null;
    const localTime = Date.parse(local.updatedAt);
    const serverTime = server ? Date.parse(server.updatedAt) : 0;
    const shouldUpload =
      !server ||
      !Number.isFinite(serverTime) ||
      (Number.isFinite(localTime) && localTime > serverTime);

    if (!shouldUpload) return;

    await saveQuranProgress({
      mode: local.mode,
      surahNumber: local.surahNumber,
      ayahNumber: local.ayahNumber,
    });
  } catch {
    // Non-blocking — guest progress stays local.
  }
}
