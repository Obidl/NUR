import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { globalSearch } from '@/features/search/api/searchApi';
import type { SearchHit } from '@/features/search/types/search.types';
import { getErrorMessage } from '@/shared/lib/errors';

const TYPE_LABEL: Record<SearchHit['type'], string> = {
  quran: 'Qur’on',
  podcasts: 'Podcast',
  books: 'Kitob',
  research: 'Tadqiqot',
};

const FILTERS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Hammasi' },
  { id: 'quran', label: 'Qur’on' },
  { id: 'podcasts', label: 'Podcast' },
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
    <section className="mx-auto max-w-3xl px-4 py-8 pb-24 md:px-6 md:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-medium">Qidiruv</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Faqat nashr qilingan kontent. Bo‘sh natija — uydirma yo‘q.
        </p>
      </header>

      <form
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query, types);
        }}
      >
        <label className="block text-sm">
          <span className="sr-only">Qidiruv so‘zi</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Masalan: Fotiha…"
            className="w-full rounded-[var(--radius-m)] border border-nur-line bg-nur-elevated px-3 py-3 text-sm"
            autoFocus
          />
        </label>
      </form>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Tur filteri">
        {FILTERS.map((filter) => (
          <button
            key={filter.id || 'all'}
            type="button"
            onClick={() => {
              setTypes(filter.id);
              submit(query, filter.id);
            }}
            className={
              types === filter.id
                ? 'rounded-[var(--radius-s)] bg-nur-sunken px-3 py-1.5 text-xs text-nur-ink'
                : 'rounded-[var(--radius-s)] px-3 py-1.5 text-xs text-nur-muted'
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}
      {loading ? <p className="text-sm text-nur-muted">Qidirilmoqda…</p> : null}

      {!loading && !query.trim() ? (
        <p className="text-sm text-nur-muted">Qidirish uchun so‘z yozing.</p>
      ) : null}

      {!loading && query.trim() && hits.length === 0 ? (
        <p className="text-sm text-nur-muted">Natija topilmadi.</p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {hits.map((hit) => (
          <li key={`${hit.type}-${hit.href}-${hit.title}`}>
            <Link to={hit.href} className="block py-4 hover:text-nur-accent">
              <p className="text-xs uppercase tracking-wide text-nur-faint">
                {TYPE_LABEL[hit.type]}
              </p>
              <p className="mt-1 font-medium">{hit.title}</p>
              <p className="mt-1 text-sm text-nur-muted">{hit.snippet}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
