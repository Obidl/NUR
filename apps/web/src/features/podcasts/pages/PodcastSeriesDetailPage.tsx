import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
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
  const { toast } = useToast();

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
        toast('Sevimlidan olib tashlandi', 'info');
      } else {
        const created = await addPodcastFavorite({
          targetType: 'series',
          targetId: series.id,
        });
        setFavorites((prev) => [created, ...prev]);
        toast('Sevimlilarga qo‘shildi', 'success');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <DetailLoading cover />;

  if (error && !series) {
    return (
      <section className="nur-page">
        <ErrorState message={error} />
        <Button to="/podcasts" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  if (!series) return null;

  return (
    <section className="nur-page nur-fade-in pb-28">
      <DetailBackLink to="/podcasts">Podcastlar</DetailBackLink>

      <div className="mt-8 flex gap-5">
        <img
          src={series.coverUrl}
          alt=""
          className="h-28 w-28 rounded-[var(--radius-xl)] object-cover shadow-[var(--shadow-sm)]"
        />
        <div className="min-w-0">
          <h1 className="nur-page-title !text-[1.5rem] md:!text-[1.75rem]">{series.title}</h1>
          <p className="mt-2 text-sm text-nur-muted">{series.hostOrScholar}</p>
          <button
            type="button"
            onClick={() => void toggleFavorite()}
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-m)] px-3 py-2 text-sm font-medium text-nur-lamp transition-colors duration-200 hover:bg-nur-lamp-soft"
            aria-label="Sevimlilarga qo‘shish"
          >
            <Heart size={16} fill={seriesFavorite ? 'currentColor' : 'none'} />
            {seriesFavorite ? 'Sevimlida' : 'Sevimli'}
          </button>
        </div>
      </div>

      <p className="mt-8 text-sm leading-7 text-nur-muted">{series.description}</p>
      {series.description.toLowerCase().includes('placeholder') ? (
        <p role="status" className="mt-3 text-xs text-nur-faint">
          Asl audio manbalari hali ulanmagan bo‘lishi mumkin — playerda eslatma chiqadi.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-[var(--nur-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <h2 className="nur-section-title mt-10 mb-3">Epizodlar ({episodes.length})</h2>
      {episodes.length === 0 ? (
        <p className="text-sm text-nur-muted">Hali epizod yo‘q.</p>
      ) : (
        <ul className="nur-list">
          {episodes.map((episode) => (
            <li key={episode.id}>
              <div className="nur-list-row justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-[-0.01em]">
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
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-lamp text-nur-lamp-ink shadow-[var(--shadow-sm)] transition-[transform,filter] duration-200 hover:brightness-[0.97] active:scale-[0.98]"
                  aria-label={`${episode.title} ni tinglash`}
                  onClick={() => void playEpisode(episode.id)}
                >
                  <Play size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
