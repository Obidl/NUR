import {
  fetchPodcastProgress,
  savePodcastProgress,
} from '@/features/podcasts/api/podcastApi';
import type { PodcastProgressItem } from '@/features/podcasts/types/podcast.types';

const STORAGE_KEY = 'nur_podcast_local_progress';

export type LocalPodcastProgress = {
  episodeId: string;
  title: string;
  seriesSlug: string;
  seriesTitle: string;
  hostOrScholar: string;
  coverUrl: string | null;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
};

type ProgressMap = Record<string, LocalPodcastProgress>;

function readMap(): ProgressMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeMap(map: ProgressMap): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function writeLocalPodcastProgress(input: {
  episodeId: string;
  title: string;
  seriesSlug: string;
  seriesTitle: string;
  hostOrScholar: string;
  coverUrl?: string | null;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}): void {
  if (!input.episodeId || input.durationSeconds <= 0) return;
  const map = readMap();
  const completed =
    input.completed ?? input.positionSeconds >= input.durationSeconds * 0.95;
  map[input.episodeId] = {
    episodeId: input.episodeId,
    title: input.title,
    seriesSlug: input.seriesSlug,
    seriesTitle: input.seriesTitle,
    hostOrScholar: input.hostOrScholar,
    coverUrl: input.coverUrl ?? null,
    positionSeconds: input.positionSeconds,
    durationSeconds: input.durationSeconds,
    completed,
    updatedAt: new Date().toISOString(),
  };
  writeMap(map);
}

export function readLocalPodcastProgressList(): LocalPodcastProgress[] {
  return Object.values(readMap()).sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

export function readLocalPodcastPositionMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of Object.values(readMap())) {
    map[row.episodeId] = row.positionSeconds;
  }
  return map;
}

export function toLibraryPodcastRows(
  rows: LocalPodcastProgress[],
): PodcastProgressItem[] {
  return rows.map((row) => ({
    episodeId: row.episodeId,
    title: row.title,
    seriesSlug: row.seriesSlug,
    seriesTitle: row.seriesTitle,
    hostOrScholar: row.hostOrScholar,
    coverUrl: row.coverUrl ?? '',
    positionSeconds: row.positionSeconds,
    durationSeconds: row.durationSeconds,
    completed: row.completed,
    updatedAt: row.updatedAt,
  }));
}

/** Upload device podcast progress when newer than server (or missing). */
export async function syncLocalPodcastProgressToServer(): Promise<void> {
  const localRows = readLocalPodcastProgressList();
  if (!localRows.length) return;

  try {
    const serverRows = await fetchPodcastProgress();
    const serverById = new Map(serverRows.map((row) => [row.episodeId, row]));

    for (const local of localRows) {
      const server = serverById.get(local.episodeId);
      const localTime = Date.parse(local.updatedAt);
      const serverTime = server ? Date.parse(server.updatedAt) : 0;
      const shouldUpload =
        !server ||
        !Number.isFinite(serverTime) ||
        (Number.isFinite(localTime) && localTime > serverTime);

      if (!shouldUpload) continue;

      await savePodcastProgress({
        episodeId: local.episodeId,
        positionSeconds: local.positionSeconds,
        durationSeconds: local.durationSeconds,
        completed: local.completed,
      });
    }
  } catch {
    // Non-blocking — guest progress stays local.
  }
}
