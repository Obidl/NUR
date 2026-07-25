import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import {
  addPodcastFavorite,
  fetchPodcastEpisode,
  fetchPodcastFavorites,
  fetchPodcastProgress,
  fetchPodcastSeriesDetail,
  removePodcastFavorite,
} from '@/features/podcasts/api/podcastApi';
import { usePodcastPlayerStore } from '@/features/podcasts/store/podcastPlayerStore';
import type {
  PodcastEpisodeSummary,
  PodcastFavorite,
  PodcastSeriesCard,
} from '@/features/podcasts/types/podcast.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m} daqiqa`;
}

export function PodcastSeriesDetailPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const loadEpisode = usePodcastPlayerStore((s) => s.loadEpisode);

  const [series, setSeries] = useState<PodcastSeriesCard | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisodeSummary[]>([]);
  const [favorites, setFavorites] = useState<PodcastFavorite[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchPodcastSeriesDetail(slug);
        if (cancelled) return;
        setSeries(detail.series);
        setEpisodes(detail.episodes);

        if (accessToken) {
          const [favs, progress] = await Promise.all([
            fetchPodcastFavorites(),
            fetchPodcastProgress(),
          ]);
          if (cancelled) return;
          setFavorites(favs);
          const map: Record<string, number> = {};
          for (const row of progress) {
            map[row.episodeId] = row.positionSeconds;
          }
          setProgressMap(map);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Seriya topilmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, accessToken]);

  useEffect(() => {
    const episodeId = searchParams.get('episode');
    if (!episodeId || !series) return;
    void playEpisode(episodeId);
    // intentionally when series ready + query present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, searchParams]);

  const seriesFavorite = useMemo(
    () =>
      favorites.find(
        (fav) => fav.targetType === 'series' && fav.targetId === series?.id,
      ),
    [favorites, series?.id],
  );

  async function playEpisode(episodeId: string) {
    try {
      const detail = await fetchPodcastEpisode(episodeId);
      loadEpisode({
        episodeId: detail.id,
        title: detail.title,
        seriesTitle: detail.series.title,
        hostOrScholar: detail.series.hostOrScholar,
        audioUrl: detail.audioUrl,
        durationSeconds: detail.durationSeconds,
        positionSeconds: progressMap[episodeId] ?? 0,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Epizod ochilmadi'));
    }
  }

  async function toggleFavorite() {
    if (!series) return;
    if (!accessToken) {
      navigate('/login', { state: { from: `/podcasts/${slug}` } });
      return;
    }
    try {
      if (seriesFavorite) {
        await removePodcastFavorite(seriesFavorite.id);
        setFavorites((prev) => prev.filter((fav) => fav.id !== seriesFavorite.id));
      } else {
        const created = await addPodcastFavorite({
          targetType: 'series',
          targetId: series.id,
        });
        setFavorites((prev) => [created, ...prev]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (error && !series) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--nur-danger)]">{error}</p>
        <Button to="/podcasts" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  if (!series) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 pb-28 md:px-6">
      <Link to="/podcasts" className="text-sm text-nur-muted">
        ← Podcastlar
      </Link>

      <div className="mt-6 flex gap-4">
        <img
          src={series.coverUrl}
          alt=""
          className="h-28 w-28 rounded-[var(--radius-m)] object-cover"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-medium">{series.title}</h1>
          <p className="mt-1 text-sm text-nur-muted">{series.hostOrScholar}</p>
          <button
            type="button"
            onClick={() => void toggleFavorite()}
            className="mt-3 inline-flex items-center gap-2 text-sm text-nur-lamp"
            aria-label="Sevimlilarga qo‘shish"
          >
            <Heart size={16} fill={seriesFavorite ? 'currentColor' : 'none'} />
            {seriesFavorite ? 'Sevimlida' : 'Sevimli'}
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 text-nur-muted">{series.description}</p>
      {error ? <p className="mt-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}

      <h2 className="mt-10 mb-3 text-sm font-medium text-nur-muted">
        Epizodlar ({episodes.length})
      </h2>
      <ul className="divide-y divide-nur-line">
        {episodes.map((episode) => (
          <li key={episode.id} className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="font-medium">
                {episode.episodeNumber ? `${episode.episodeNumber}. ` : ''}
                {episode.title}
              </p>
              <p className="mt-1 text-xs text-nur-muted">
                {formatDuration(episode.durationSeconds)}
                {progressMap[episode.id]
                  ? ` · davom ${Math.floor(progressMap[episode.id] / 60)} daq.`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-nur-lamp text-nur-lamp-ink"
              aria-label={`${episode.title} ni tinglash`}
              onClick={() => void playEpisode(episode.id)}
            >
              <Play size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
