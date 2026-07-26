import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchVideoProgress,
  fetchVideoSeriesDetail,
  saveVideoProgress,
} from '@/features/videos/api/videoApi';
import type {
  VideoEpisodeSummary,
  VideoSeriesCard,
} from '@/features/videos/types/video.types';
import { useVideoWatchStore } from '@/features/videos/store/videoWatchStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { CoverImage } from '@/shared/components/CoverImage';
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { Input } from '@/shared/components/Field';
import { ErrorState } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';
import { displayTitle } from '@/features/home/lib/todayPath';

function embedSrc(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    // Prefer www.youtube.com/embed — Error 153 / config failures are less common with origin set.
    if (url.hostname.includes('youtube')) {
      url.hostname = 'www.youtube.com';
      if (!url.pathname.startsWith('/embed/')) {
        const id = url.searchParams.get('v') ?? url.pathname.split('/').pop();
        if (id) url.pathname = `/embed/${id}`;
      }
    }
    url.searchParams.set('rel', '0');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('playsinline', '1');
    if (typeof window !== 'undefined' && window.location?.origin) {
      url.searchParams.set('origin', window.location.origin);
    }
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
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [listQuery, setListQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markWatched = useVideoWatchStore((s) => s.markWatched);
  const lastForSeries = useVideoWatchStore((s) => s.lastForSeries);
  const accessToken = useAuthStore((s) => s.accessToken);

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

        if (accessToken) {
          try {
            const progress = await fetchVideoProgress();
            if (!cancelled) {
              setCompletedIds(
                new Set(
                  progress
                    .filter((row) => row.completed && row.seriesSlug === detail.series.slug)
                    .map((row) => row.episodeId),
                ),
              );
            }
          } catch {
            // Guest-style local continue still works if progress fetch fails
          }
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, setSearchParams, accessToken]);

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

  const filteredEpisodes = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((ep) => {
      const title = displayTitle(ep.title).toLowerCase();
      const desc = displayTitle(ep.description).toLowerCase();
      const num = ep.episodeNumber != null ? String(ep.episodeNumber) : '';
      return title.includes(q) || desc.includes(q) || num.includes(q);
    });
  }, [episodes, listQuery]);

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
    if (accessToken) {
      void saveVideoProgress({ episodeId: activeEpisode.id }).catch(() => undefined);
    }
  }, [series, activeEpisode, markWatched, accessToken]);

  function selectEpisode(episodeId: string) {
    setSearchParams({ episode: episodeId }, { replace: true });
    document.getElementById('video-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function markCompleted(episodeId: string) {
    setCompletedIds((prev) => new Set(prev).add(episodeId));
    if (accessToken) {
      try {
        await saveVideoProgress({ episodeId, completed: true });
      } catch {
        // local mark still shows
      }
    }
  }

  function goRelative(delta: number) {
    const current = episodes[activeIndex];
    const next = episodes[activeIndex + delta];
    if (delta > 0 && current) {
      void markCompleted(current.id);
    }
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
          className="mt-8 scroll-mt-24 overflow-hidden rounded-[var(--radius-l)] border border-nur-line/80 bg-nur-sunken"
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
              {!completedIds.has(activeEpisode.id) ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => void markCompleted(activeEpisode.id)}
                >
                  <Check className="h-4 w-4" strokeWidth={1.75} />
                  Ko‘rildi
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 self-center text-xs text-nur-lamp">
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  Ko‘rilgan
                </span>
              )}
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
      {episodes.length > 8 ? (
        <Input
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          placeholder="Epizod qidirish…"
          className="mb-3"
          aria-label="Epizod qidirish"
        />
      ) : null}
      {filteredEpisodes.length > 0 ? (
        <ul className="nur-list">
          {filteredEpisodes.map((episode) => {
            const active = activeEpisode?.id === episode.id;
            const done = completedIds.has(episode.id);
            const orderLabel =
              episode.episodeNumber ??
              episodes.findIndex((ep) => ep.id === episode.id) + 1;
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
                      {orderLabel}. {displayTitle(episode.title)}
                    </p>
                    {active ? (
                      <p className="mt-1 text-xs text-nur-lamp">Hozir ko‘rilmoqda</p>
                    ) : done ? (
                      <p className="mt-1 text-xs text-nur-lamp">Ko‘rilgan</p>
                    ) : (
                      <p className="mt-1 text-xs text-nur-muted line-clamp-1">
                        {displayTitle(episode.description)}
                      </p>
                    )}
                  </div>
                  {done ? (
                    <Check className="h-4 w-4 shrink-0 text-nur-lamp" strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-nur-muted">Qidiruv bo‘yicha epizod topilmadi.</p>
      )}
    </section>
  );
}
