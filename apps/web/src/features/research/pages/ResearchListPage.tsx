import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchResearch } from '@/features/research/api/researchApi';
import type { ResearchCard } from '@/features/research/types/research.types';
import { getErrorMessage } from '@/shared/lib/errors';

export function ResearchListPage() {
  const [items, setItems] = useState<ResearchCard[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchResearch({ q: query || undefined });
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Tadqiqotlar yuklanmadi'));
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
        <h1 className="text-2xl font-medium">Tadqiqot</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Manbali maqolalar. Bo‘sh katalog — uydirma olimlar yo‘q.
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
        <p className="text-sm text-nur-muted">
          Hozircha nashr qilingan maqola yo‘q. Admin orqali manbali kontent qo‘shiladi.
        </p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {items.map((article) => (
          <li key={article.id}>
            <Link
              to={`/research/${article.slug}`}
              className="block py-4 transition-colors hover:bg-nur-sunken/40"
            >
              <p className="font-medium">{article.title}</p>
              <p className="mt-1 text-sm text-nur-muted line-clamp-2">{article.summary}</p>
              <p className="mt-2 text-xs text-nur-faint">
                {article.authors.join(', ')} · {article.category}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
