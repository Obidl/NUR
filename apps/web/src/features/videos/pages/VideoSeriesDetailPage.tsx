import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchVideoSeriesDetail } from '@/features/videos/api/videoApi';
import type {
  VideoEpisodeSummary,
  VideoSeriesCard,
} from '@/features/videos/types/video.types';
import { useVideoWatchStore } from '@/features/videos/store/videoWatchStore';
import { Button } from '@/shared/components/Button';
import { CoverImage } from '@/shared/components/CoverImage';
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';
import { displayTitle } from '@/features/home/lib/todayPath';

function embedSrc(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set('rel', '0');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('playsinline', '1');
    return url.toString();
  } catch {
    return `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}rel=0&modestbranding=1&playsinline=1`;
  }
}

export function VideoSeriesDetailPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [series, setSeries] = useState<VideoSeriesCard | null>(null);
  const [episodes, setEpisodes] = useState<VideoEpisodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markWatched = useVideoWatchStore((s) => s.markWatched);
  const lastForSeries = useVideoWatchStore((s) => s.lastForSeries);

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

        const queryEp = new URLSearchParams(window.location.search).get('episode');
        if (!queryEp && detail.episodes.length > 0) {
          const remembered = lastForSeries(detail.series.slug);
          const resume =
            (remembered && detail.episodes.find((ep) => ep.id === remembered)) ||
            detail.episodes[0]!;
          setSearchParams({ episode: resume.id }, { replace: true });
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
    // lastForSeries is stable enough from zustand; omit to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, setSearchParams]);

  const activeEpisode = useMemo(() => {
    const fromQuery = searchParams.get('episode');
    if (fromQuery) {
      const match = episodes.find((ep) => ep.id === fromQuery);
      if (match) return match;
    }
    return episodes[0] ?? null;
  }, [episodes, searchParams]);

  const activeIndex = useMemo(() => {
    if (!activeEpisode) return -1;
    return episodes.findIndex((ep) => ep.id === activeEpisode.id);
  }, [activeEpisode, episodes]);

  useEffect(() => {
    if (!series || !activeEpisode) return;
    markWatched({
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      hostOrScholar: series.hostOrScholar,
      episodeId: activeEpisode.id,
      episodeTitle: activeEpisode.title,
      episodeNumber: activeEpisode.episodeNumber,
      coverUrl: activeEpisode.coverUrl ?? series.coverUrl,
    });
  }, [series, activeEpisode, markWatched]);

  function selectEpisode(episodeId: string) {
    setSearchParams({ episode: episodeId }, { replace: true });
    document.getElementById('video-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goRelative(delta: number) {
    const next = episodes[activeIndex + delta];
    if (next) selectEpisode(next.id);
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
        <p className="mt-2 text-xs text-nur-faint">
          {series.episodeCount || episodes.length} ta video · ketma-ket ro‘yxat
        </p>
        <p className="mt-4 text-sm leading-7 text-nur-muted">{series.description}</p>
        <p className="mt-3 text-xs text-nur-faint">
          Ilova ichida ko‘rish — stream YouTube’da qoladi, sahifa almashtirilmaydi.
        </p>
      </header>

      {activeEpisode ? (
        <div
          id="video-player"
          className="mt-8 scroll-mt-24 overflow-hidden rounded-[var(--radius-xl)] border border-nur-line bg-nur-sunken shadow-[var(--shadow-sm)]"
        >
          <div className="relative aspect-video w-full bg-black">
            <iframe
              key={activeEpisode.youtubeVideoId}
              title={activeEpisode.title}
              src={embedSrc(activeEpisode.embedUrl)}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="px-4 py-4">
            <p className="text-sm font-semibold tracking-[-0.01em]">
              {activeEpisode.episodeNumber ? `${activeEpisode.episodeNumber}. ` : ''}
              {displayTitle(activeEpisode.title)}
            </p>
            <p className="mt-1 text-xs text-nur-muted line-clamp-2">
              {displayTitle(activeEpisode.description)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5"
                disabled={activeIndex <= 0}
                onClick={() => goRelative(-1)}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                Oldingi
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5"
                disabled={activeIndex < 0 || activeIndex >= episodes.length - 1}
                onClick={() => goRelative(1)}
              >
                Keyingi
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </Button>
              <span className="ml-auto self-center text-xs text-nur-faint">
                {activeIndex + 1} / {episodes.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-nur-muted">Hali epizod yo‘q.</p>
      )}

      <h2 className="nur-section-title mt-10 mb-3">
        Barcha videolar ({episodes.length})
      </h2>
      <p className="mb-3 text-xs text-nur-faint">
        Qayerda to‘xtaganingizni topish uchun ro‘yxatdan tanlang — YouTube’ga o‘tmaydi.
      </p>
      {episodes.length > 0 ? (
        <ul className="nur-list">
          {episodes.map((episode, index) => {
            const active = activeEpisode?.id === episode.id;
            return (
              <li key={episode.id}>
                <button
                  type="button"
                  onClick={() => selectEpisode(episode.id)}
                  className={cx(
                    'nur-list-row w-full text-left',
                    active && 'bg-nur-sunken/70 ring-1 ring-nur-lamp/40',
                  )}
                >
                  <CoverImage
                    src={episode.coverUrl ?? series.coverUrl}
                    className="h-12 w-20 shrink-0 rounded-[var(--radius-m)] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-[-0.01em]">
                      {episode.episodeNumber ?? index + 1}. {displayTitle(episode.title)}
                    </p>
                    {active ? (
                      <p className="mt-1 text-xs text-nur-lamp">Hozir ko‘rilmoqda</p>
                    ) : (
                      <p className="mt-1 text-xs text-nur-muted line-clamp-1">
                        {displayTitle(episode.description)}
                      </p>
                    )}
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
