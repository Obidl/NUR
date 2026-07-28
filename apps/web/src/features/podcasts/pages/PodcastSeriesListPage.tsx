import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic2 } from 'lucide-react';
import { fetchPodcastProgress, fetchPodcastSeries } from '@/features/podcasts/api/podcastApi';
import {
  readLocalPodcastProgressList,
  toLibraryPodcastRows,
} from '@/features/podcasts/lib/podcastLocalProgress';
import type {
  PodcastProgressItem,
  PodcastSeriesCard,
} from '@/features/podcasts/types/podcast.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CoverImage } from '@/shared/components/CoverImage';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Field';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';

export function PodcastSeriesListPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<PodcastSeriesCard[]>([]);
  const [continueItems, setContinueItems] = useState<PodcastProgressItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPodcastSeries({ q: query || undefined });
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Podcastlar yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    function fromLocal() {
      return toLibraryPodcastRows(
        readLocalPodcastProgressList().filter((row) => !row.completed),
      ).slice(0, 3);
    }

    if (!accessToken) {
      setContinueItems(fromLocal());
      return;
    }

    void fetchPodcastProgress()
      .then((rows) => {
        if (cancelled) return;
        const incomplete = rows.filter((row) => !row.completed);
        setContinueItems(incomplete.length > 0 ? incomplete.slice(0, 3) : fromLocal());
      })
      .catch(() => {
        if (!cancelled) setContinueItems(fromLocal());
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <PageShell
      title="Podcastlar"
      description="Faqat tasdiqlangan, manbali seriyalar. Fake kontent bo‘lmaydi."
    >
      {continueItems.length > 0 ? (
        <div className="mb-8">
          <h2 className="nur-section-title mb-3">Davom ettirish</h2>
          <ul className="nur-list">
            {continueItems.map((item) => (
              <li key={item.episodeId}>
                <Link
                  to={`/podcasts/${item.seriesSlug}?episode=${item.episodeId}`}
                  className="nur-list-row justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-nur-muted">
                      {item.hostOrScholar}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-nur-accent">
                    {Math.floor(item.positionSeconds / 60)} daqiqa
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Qidirish…"
        className="mb-6"
        aria-label="Podcast qidiruv"
      />

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={5} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Mic2 className="h-5 w-5" strokeWidth={1.75} />}
          title="Hali podcast yo‘q"
          description="Nashr qilingan seriya bo‘sh. Admin orqali litsenziyalangan audio qo‘shiladi."
          actionLabel="Bugunga"
          actionTo="/"
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="nur-list">
          {items.map((series) => (
            <li key={series.id}>
              <Link to={`/podcasts/${series.slug}`} className="nur-list-row">
                <CoverImage
                  src={series.coverUrl}
                  className="h-14 w-14 shrink-0 rounded-[var(--radius-m)] object-cover "
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-[-0.01em]">{series.title}</p>
                  <p className="mt-1 truncate text-sm text-nur-muted">{series.hostOrScholar}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
