import { useEffect, useRef } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { useQuranPlayerStore } from '@/features/quran/store/quranPlayerStore';

type QuranAudioBarProps = {
  onAyahBoundary?: (ayahNumber: number) => void;
};

export function QuranAudioBar({ onAyahBoundary }: QuranAudioBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useQuranPlayerStore((s) => s.audioUrl);
  const isPlaying = useQuranPlayerStore((s) => s.isPlaying);
  const reciterName = useQuranPlayerStore((s) => s.reciterName);
  const surahNumber = useQuranPlayerStore((s) => s.surahNumber);
  const ayahNumber = useQuranPlayerStore((s) => s.ayahNumber);
  const scope = useQuranPlayerStore((s) => s.scope);
  const error = useQuranPlayerStore((s) => s.error);
  const pause = useQuranPlayerStore((s) => s.pause);
  const setPlaying = useQuranPlayerStore((s) => s.setPlaying);
  const stop = useQuranPlayerStore((s) => s.stop);
  const playAyah = useQuranPlayerStore((s) => s.playAyah);
  const playSurah = useQuranPlayerStore((s) => s.playSurah);

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
    <div className="sticky bottom-0 z-20 border-t border-nur-line bg-nur-elevated/95 px-4 py-3 backdrop-blur">
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          setPlaying(false);
          if (scope === 'ayah' && surahNumber && ayahNumber) {
            onAyahBoundary?.(ayahNumber);
          }
        }}
      />
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-nur-ink">
            {scope === 'surah'
              ? `Surah ${surahNumber}`
              : `Surah ${surahNumber} · oyat ${ayahNumber}`}
          </p>
          <p className="truncate text-xs text-nur-muted">
            {reciterName ?? 'Qori'} · islomiy CDN audio
          </p>
          {error ? <p className="text-xs text-[var(--nur-danger)]">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-nur-lamp text-nur-lamp-ink"
            aria-label={isPlaying ? 'Pauza' : 'Ijro'}
            onClick={() => {
              if (!audioUrl) return;
              if (isPlaying) pause();
              else if (scope === 'ayah' && surahNumber && ayahNumber) {
                void playAyah(surahNumber, ayahNumber);
              } else if (scope === 'surah' && surahNumber) {
                void playSurah(surahNumber);
              } else {
                setPlaying(true);
              }
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-nur-line text-nur-muted"
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
