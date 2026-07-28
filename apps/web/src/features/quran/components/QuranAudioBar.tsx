import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, X } from 'lucide-react';
import { useQuranPlayerStore } from '@/features/quran/store/quranPlayerStore';

export function QuranAudioBar() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useQuranPlayerStore((s) => s.audioUrl);
  const isPlaying = useQuranPlayerStore((s) => s.isPlaying);
  const reciterName = useQuranPlayerStore((s) => s.reciterName);
  const surahNumber = useQuranPlayerStore((s) => s.surahNumber);
  const ayahNumber = useQuranPlayerStore((s) => s.ayahNumber);
  const ayahCount = useQuranPlayerStore((s) => s.ayahCount);
  const scope = useQuranPlayerStore((s) => s.scope);
  const error = useQuranPlayerStore((s) => s.error);
  const pause = useQuranPlayerStore((s) => s.pause);
  const setPlaying = useQuranPlayerStore((s) => s.setPlaying);
  const stop = useQuranPlayerStore((s) => s.stop);
  const playAyah = useQuranPlayerStore((s) => s.playAyah);
  const playNextAyah = useQuranPlayerStore((s) => s.playNextAyah);
  const onAyahBoundary = useQuranPlayerStore((s) => s.onAyahBoundary);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;

    el.src = audioUrl;
    void el.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [audioUrl, setPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [isPlaying, setPlaying]);

  if (!audioUrl && !error) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-[color-mix(in_srgb,var(--nur-quran-ornament)_14%,var(--nur-line))] bg-[color-mix(in_srgb,var(--nur-quran-panel)_94%,transparent)] px-4 py-3 backdrop-blur-xl md:bottom-0">
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          void (async () => {
            const next = await playNextAyah();
            if (next != null) {
              onAyahBoundary?.(next);
              return;
            }
            setPlaying(false);
            if (ayahNumber) onAyahBoundary?.(ayahNumber);
          })();
        }}
      />
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0 border-l-2 border-l-[var(--nur-quran-ornament)] pl-3">
          {surahNumber ? (
            <Link
              to={`/quran/${surahNumber}${ayahNumber ? `?ayah=${ayahNumber}` : ''}`}
              className="block truncate text-sm font-medium tracking-[-0.01em] text-[var(--nur-quran-ink)] hover:opacity-80"
            >
              Surah {surahNumber}
              {ayahNumber ? ` · oyat ${ayahNumber}` : ''}
              {ayahCount ? ` / ${ayahCount}` : ''}
            </Link>
          ) : (
            <p className="truncate text-sm font-medium tracking-[-0.01em] text-[var(--nur-quran-ink)]">
              Qur’on
            </p>
          )}
          <p className="truncate text-xs leading-relaxed text-[var(--nur-quran-muted)]">
            {reciterName ?? 'Qori'}
            {scope === 'surah' ? ' · surah ketma-ket' : ' · oyat'}
          </p>
          {error ? <p className="text-xs text-[var(--nur-danger)]">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-nur-accent text-[var(--nur-accent-ink)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.98]"
            aria-label={isPlaying ? 'Pauza' : 'Ijro'}
            onClick={() => {
              if (!audioUrl) return;
              if (isPlaying) {
                pause();
                return;
              }
              if (surahNumber && ayahNumber) {
                void playAyah(surahNumber, ayahNumber, {
                  ayahCount: ayahCount ?? undefined,
                  autoAdvance: true,
                });
              } else {
                setPlaying(true);
              }
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-m)] border border-nur-line text-[var(--nur-quran-muted)] transition-colors duration-200 hover:bg-[var(--nur-quran-translation-plane)] hover:text-[var(--nur-quran-ink)]"
            aria-label="Yopish"
            onClick={() => stop()}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
