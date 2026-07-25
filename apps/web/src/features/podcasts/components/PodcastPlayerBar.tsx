import { useEffect, useRef } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { usePodcastPlayerStore } from '@/features/podcasts/store/podcastPlayerStore';
import { useAuthStore } from '@/features/auth/store/authStore';

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function PodcastPlayerBar() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const audioUrl = usePodcastPlayerStore((s) => s.audioUrl);
  const title = usePodcastPlayerStore((s) => s.title);
  const hostOrScholar = usePodcastPlayerStore((s) => s.hostOrScholar);
  const isPlaying = usePodcastPlayerStore((s) => s.isPlaying);
  const positionSeconds = usePodcastPlayerStore((s) => s.positionSeconds);
  const durationSeconds = usePodcastPlayerStore((s) => s.durationSeconds);
  const playbackRate = usePodcastPlayerStore((s) => s.playbackRate);
  const setPlaying = usePodcastPlayerStore((s) => s.setPlaying);
  const setPosition = usePodcastPlayerStore((s) => s.setPosition);
  const setPlaybackRate = usePodcastPlayerStore((s) => s.setPlaybackRate);
  const persistProgress = usePodcastPlayerStore((s) => s.persistProgress);
  const stop = usePodcastPlayerStore((s) => s.stop);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;

    const startAt = usePodcastPlayerStore.getState().positionSeconds;
    el.src = audioUrl;
    el.currentTime = startAt;
    el.playbackRate = usePodcastPlayerStore.getState().playbackRate;
    void el.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [audioUrl, setPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    el.playbackRate = playbackRate;
  }, [playbackRate, audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (isPlaying) {
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [isPlaying, audioUrl, setPlaying]);

  useEffect(() => {
    if (!audioUrl) return;
    const id = window.setInterval(() => {
      void persistProgress(accessToken);
    }, 8000);
    return () => window.clearInterval(id);
  }, [audioUrl, accessToken, persistProgress]);

  if (!audioUrl) return null;

  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-nur-line bg-nur-elevated/95 px-4 py-3 backdrop-blur md:bottom-0">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;
          if (Number.isFinite(duration) && duration > 0) {
            usePodcastPlayerStore.setState({ durationSeconds: duration });
          }
        }}
        onEnded={() => {
          setPlaying(false);
          void persistProgress(accessToken);
        }}
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-nur-muted">{hostOrScholar}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Tezlik"
              value={playbackRate}
              onChange={(event) => setPlaybackRate(Number(event.target.value))}
              className="rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-2 py-1 text-xs"
            >
              {[0.75, 1, 1.25, 1.5, 1.75].map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-nur-lamp text-nur-lamp-ink"
              aria-label={isPlaying ? 'Pauza' : 'Ijro'}
              onClick={() => setPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-nur-line text-nur-muted"
              aria-label="Yopish"
              onClick={() => {
                void persistProgress(accessToken);
                stop();
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <label className="flex items-center gap-3 text-xs text-nur-muted">
          <span>{formatTime(positionSeconds)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(durationSeconds, 1)}
            step={1}
            value={Math.min(positionSeconds, durationSeconds || 0)}
            onChange={(event) => {
              const next = Number(event.target.value);
              setPosition(next);
              if (audioRef.current) audioRef.current.currentTime = next;
            }}
            className="w-full"
          />
          <span>{formatTime(durationSeconds)}</span>
        </label>
      </div>
    </div>
  );
}
