import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { globalSearch } from '@/features/search/api/searchApi';
import type { SearchHit } from '@/features/search/types/search.types';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

const TYPE_LABEL: Record<SearchHit['type'], string> = {
  quran: 'Qur’on',
  podcasts: 'Podcast',
  videos: 'Video',
  books: 'Kitob',
  research: 'Tadqiqot',
};

const FILTERS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Hammasi' },
  { id: 'quran', label: 'Qur’on' },
  { id: 'podcasts', label: 'Podcast' },
  { id: 'videos', label: 'Video' },
  { id: 'books', label: 'Kitob' },
  { id: 'research', label: 'Tadqiqot' },
];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const initialTypes = params.get('types') ?? '';

  const [query, setQuery] = useState(initialQ);
  const [types, setTypes] = useState(initialTypes);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = params.get('q')?.trim() ?? '';
    const t = params.get('types') ?? '';
    setQuery(q);
    setTypes(t);

    if (!q) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void globalSearch({ q, types: t || undefined })
      .then((rows) => {
        if (!cancelled) setHits(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Qidiruv amalga oshmadi'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params]);

  function submit(nextQ: string, nextTypes: string) {
    const next = new URLSearchParams();
    if (nextQ.trim()) next.set('q', nextQ.trim());
    if (nextTypes) next.set('types', nextTypes);
    setParams(next, { replace: true });
  }

  return (
    <PageShell
      title="Qidiruv"
      description="Faqat nashr qilingan kontent. Bo‘sh natija — uydirma yo‘q."
      className="pb-24 md:pb-8"
    >
      <form
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query, types);
        }}
      >
        <label className="relative block">
          <span className="sr-only">Qidiruv so‘zi</span>
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-nur-faint"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Masalan: Fotiha…"
            className="nur-input pl-10"
            autoFocus
          />
        </label>
      </form>

      <div className="mb-8 flex flex-wrap gap-1.5" role="group" aria-label="Tur filteri">
        {FILTERS.map((filter) => (
          <button
            key={filter.id || 'all'}
            type="button"
            onClick={() => {
              setTypes(filter.id);
              submit(query, filter.id);
            }}
            className={cx(
              'rounded-[var(--radius-m)] px-3 py-2 text-xs font-medium transition-colors duration-200',
              types === filter.id
                ? 'bg-nur-sunken text-nur-ink'
                : 'text-nur-muted hover:bg-nur-sunken/50 hover:text-nur-ink',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-6">
          <ErrorState
            message={error}
            onRetry={() => submit(query, types)}
          />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={5} /> : null}

      {!loading && !query.trim() ? (
        <EmptyState
          icon={<Search className="h-5 w-5" strokeWidth={1.75} />}
          title="Nimani qidiramiz?"
          description="Surah, podcast, kitob yoki tadqiqot nomini yozing."
          actionLabel="Bugunga"
          actionTo="/"
        />
      ) : null}

      {!loading && query.trim() && hits.length === 0 && !error ? (
        <EmptyState
          title="Natija topilmadi"
          description="Boshqa so‘z yoki filtr bilan urinib ko‘ring. Uydirma kontent qo‘shilmaydi."
          actionLabel="Bugunga"
          actionTo="/"
        />
      ) : null}

      {!loading && hits.length > 0 ? (
        <ul className="nur-list">
          {hits.map((hit) => (
            <li key={`${hit.type}-${hit.href}-${hit.title}`}>
              <Link to={hit.href} className="nur-list-row !items-start">
                <div className="min-w-0">
                  <p className="nur-section-label">{TYPE_LABEL[hit.type]}</p>
                  <p className="mt-1 text-sm font-semibold tracking-[-0.01em]">{hit.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-nur-muted">{hit.snippet}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
