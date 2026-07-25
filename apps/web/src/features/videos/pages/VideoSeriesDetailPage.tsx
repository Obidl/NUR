import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { fetchVideoSeriesDetail } from '@/features/videos/api/videoApi';
import type {
  VideoEpisodeSummary,
  VideoSeriesCard,
} from '@/features/videos/types/video.types';
import { Button } from '@/shared/components/Button';
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

export function VideoSeriesDetailPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [series, setSeries] = useState<VideoSeriesCard | null>(null);
  const [episodes, setEpisodes] = useState<VideoEpisodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchVideoSeriesDetail(slug);
        if (cancelled) return;
        setSeries(detail.series);
        setEpisodes(detail.episodes);
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
  }, [slug]);

  const activeEpisode = useMemo(() => {
    const fromQuery = searchParams.get('episode');
    if (fromQuery) {
      const match = episodes.find((ep) => ep.id === fromQuery);
      if (match) return match;
    }
    return episodes[0] ?? null;
  }, [episodes, searchParams]);

  function selectEpisode(episodeId: string) {
    setSearchParams({ episode: episodeId }, { replace: true });
  }

  if (loading) return <DetailLoading cover />;

  if (error && !series) {
    return (
      <section className="nur-page">
        <ErrorState message={error} />
        <Button to="/videos" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  if (!series) return null;

  return (
    <section className="nur-page nur-fade-in pb-28">
      <DetailBackLink to="/videos">Videolar</DetailBackLink>

      <header className="mt-8">
        <h1 className="nur-page-title !text-[1.5rem] md:!text-[1.75rem]">{series.title}</h1>
        <p className="mt-2 text-sm text-nur-muted">{series.hostOrScholar}</p>
        <p className="mt-4 text-sm leading-7 text-nur-muted">{series.description}</p>
        <p className="mt-3 text-xs text-nur-faint">
          YouTube embed — stream YouTube’da; NUR qayta host qilmaydi.
        </p>
      </header>

      {activeEpisode ? (
        <div className="mt-8 overflow-hidden rounded-[var(--radius-xl)] border border-nur-line bg-nur-sunken shadow-[var(--shadow-sm)]">
          <div className="relative aspect-video w-full bg-black">
            <iframe
              key={activeEpisode.youtubeVideoId}
              title={activeEpisode.title}
              src={`${activeEpisode.embedUrl}?rel=0`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-[-0.01em]">{activeEpisode.title}</p>
              <p className="mt-1 text-xs text-nur-muted line-clamp-2">
                {activeEpisode.description}
              </p>
            </div>
            <a
              href={activeEpisode.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-m)] px-3 py-2 text-xs font-medium text-nur-accent transition-colors hover:bg-nur-accent-soft"
            >
              YouTube’da ochish
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-nur-muted">Hali epizod yo‘q.</p>
      )}

      <h2 className="nur-section-title mt-10 mb-3">Epizodlar ({episodes.length})</h2>
      {episodes.length > 0 ? (
        <ul className="nur-list">
          {episodes.map((episode) => {
            const active = activeEpisode?.id === episode.id;
            return (
              <li key={episode.id}>
                <button
                  type="button"
                  onClick={() => selectEpisode(episode.id)}
                  className={cx(
                    'nur-list-row w-full text-left',
                    active && 'bg-nur-sunken/70',
                  )}
                >
                  <img
                    src={episode.coverUrl ?? series.coverUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-[var(--radius-m)] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-[-0.01em]">
                      {episode.episodeNumber ? `${episode.episodeNumber}. ` : ''}
                      {episode.title}
                    </p>
                    <p className="mt-1 text-xs text-nur-muted line-clamp-1">
                      {episode.description}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
