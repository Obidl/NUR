import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Route } from 'lucide-react';
import { fetchCurriculumPaths } from '@/features/curriculum/api/curriculumApi';
import type { PathCard } from '@/features/curriculum/types/curriculum.types';
import { getErrorMessage } from '@/shared/lib/errors';
import { displayTitle, isExampleLabel } from '@/features/home/lib/todayPath';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Field';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';

export function CurriculumListPage() {
  const [items, setItems] = useState<PathCard[]>([]);
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
        const result = await fetchCurriculumPaths({ q: query || undefined });
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Yo‘llar yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  return (
    <PageShell
      title="O‘quv yo‘llari"
      description="Kunlik yo‘l: Qur’on, podcast, kitob — tartib bilan. Qidirish shart emas."
    >
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Qidirish…"
        className="mb-6"
        aria-label="Yo‘l qidiruv"
      />

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={3} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Route className="h-5 w-5" strokeWidth={1.75} />}
          title="Hali yo‘l yo‘q"
          description="Nashr qilingan o‘quv yo‘li bo‘sh. Tez orada Bugungi yo‘l bu yerdan ochiladi."
          actionLabel="Bugunga"
          actionTo="/"
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="nur-list">
          {items.map((path) => (
            <li key={path.id}>
              <Link to={`/curriculum/${path.slug}`} className="nur-list-row !items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold tracking-[-0.01em]">
                      {displayTitle(path.title)}
                    </p>
                    {isExampleLabel(path.title) ? (
                      <span className="rounded-[var(--radius-s)] border border-nur-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-nur-faint">
                        EXAMPLE
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-nur-muted line-clamp-2">
                    {displayTitle(path.summary)}
                  </p>
                  <p className="mt-2 text-xs text-nur-faint">
                    {path.moduleCount} kun · {path.lessonCount} dars
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
