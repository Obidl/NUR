import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCurriculumPaths } from '@/features/curriculum/api/curriculumApi';
import type { PathCard } from '@/features/curriculum/types/curriculum.types';
import { getErrorMessage } from '@/shared/lib/errors';
import { displayTitle, isExampleLabel } from '@/features/home/lib/todayPath';

export function CurriculumListPage() {
  const [items, setItems] = useState<PathCard[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [query]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium">O‘quv yo‘llari</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Kunlik yo‘l: Qur’on, podcast, kitob — tartib bilan. Qidirish shart emas.
        </p>
      </header>

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
        <p className="text-sm text-nur-muted">Hozircha nashr qilingan o‘quv yo‘li yo‘q.</p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {items.map((path) => (
          <li key={path.id}>
            <Link
              to={`/curriculum/${path.slug}`}
              className="block py-4 transition-colors hover:bg-nur-sunken/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{displayTitle(path.title)}</p>
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
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
