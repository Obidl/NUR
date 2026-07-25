import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPodcastProgress, fetchPodcastSeries } from '@/features/podcasts/api/podcastApi';
import type {
  PodcastProgressItem,
  PodcastSeriesCard,
} from '@/features/podcasts/types/podcast.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/lib/errors';

export function PodcastSeriesListPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<PodcastSeriesCard[]>([]);
  const [continueItems, setContinueItems] = useState<PodcastProgressItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [query]);

  useEffect(() => {
    if (!accessToken) {
      setContinueItems([]);
      return;
    }
    let cancelled = false;
    void fetchPodcastProgress()
      .then((rows) => {
        if (!cancelled) setContinueItems(rows.filter((row) => !row.completed).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setContinueItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium">Podcastlar</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Faqat tasdiqlangan, manbali seriyalar. Fake kontent bo‘lmaydi.
        </p>
      </header>

      {continueItems.length > 0 ? (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-nur-muted">Davom ettirish</h2>
          <ul className="divide-y divide-nur-line">
            {continueItems.map((item) => (
              <li key={item.episodeId}>
                <Link
                  to={`/podcasts/${item.seriesSlug}?episode=${item.episodeId}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-nur-muted">
                      {item.hostOrScholar}
                    </span>
                  </span>
                  <span className="text-xs text-nur-accent">
                    {Math.floor(item.positionSeconds / 60)} daqiqa
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Qidirish…"
        className="mb-6 w-full rounded-[var(--radius-m)] border border-nur-line bg-nur-elevated px-3 py-3 text-sm"
      />

      {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}
      {loading ? <p className="text-sm text-nur-muted">Yuklanmoqda…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-nur-muted">
          Hozircha nashr qilingan podcast yo‘q. Admin orqali haqiqiy, litsenziyalangan kontent
          qo‘shiladi.
        </p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {items.map((series) => (
          <li key={series.id}>
            <Link
              to={`/podcasts/${series.slug}`}
              className="flex gap-4 py-4 transition-colors hover:bg-nur-sunken/40"
            >
              <img
                src={series.coverUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-[var(--radius-s)] object-cover"
              />
              <div className="min-w-0">
                <p className="font-medium">{series.title}</p>
                <p className="mt-1 text-sm text-nur-muted">{series.hostOrScholar}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
