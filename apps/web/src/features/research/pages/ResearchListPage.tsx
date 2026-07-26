import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { fetchResearch } from '@/features/research/api/researchApi';
import type { ResearchCard } from '@/features/research/types/research.types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Field';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';

export function ResearchListPage() {
  const [items, setItems] = useState<ResearchCard[]>([]);
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
  }, [query, reloadKey]);

  return (
    <PageShell
      title="Tadqiqot"
      description="Manbali maqolalar. Bo‘sh katalog — uydirma olimlar yo‘q."
    >
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Qidirish…"
        className="mb-6"
        aria-label="Tadqiqot qidiruv"
      />

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={4} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" strokeWidth={1.75} />}
          title="Hali maqola yo‘q"
          description="Nashr qilingan tadqiqot bo‘sh. Manbali kontent admin orqali qo‘shiladi."
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="nur-list">
          {items.map((article) => (
            <li key={article.id}>
              <Link to={`/research/${article.slug}`} className="nur-list-row !items-start">
                <div className="min-w-0">
                  <p className="font-display text-base font-medium tracking-[-0.015em]">
                    {article.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-nur-muted line-clamp-2">
                    {article.summary}
                  </p>
                  <p className="mt-2.5 text-xs text-nur-faint">
                    {article.authors.join(', ')}
                    {article.category ? (
                      <span className="ms-2 inline-flex rounded-[var(--radius-pill)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nur-accent ring-1 ring-nur-line">
                        {article.category}
                      </span>
                    ) : null}
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
