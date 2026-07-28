/**
 * Cross-feature media exclusivity — one audio source at a time.
 * Uses dynamic imports to avoid circular store deps.
 */
export async function stopOtherMedia(active: 'quran' | 'podcast'): Promise<void> {
  if (active === 'quran') {
    const { usePodcastPlayerStore } = await import(
      '@/features/podcasts/store/podcastPlayerStore'
    );
    usePodcastPlayerStore.getState().stop();
    return;
  }
  const { useQuranPlayerStore } = await import('@/features/quran/store/quranPlayerStore');
  useQuranPlayerStore.getState().stop();
}
