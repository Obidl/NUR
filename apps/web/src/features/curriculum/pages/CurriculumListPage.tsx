import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCurriculumPaths } from '@/features/curriculum/api/curriculumApi';
import type { PathCard } from '@/features/curriculum/types/curriculum.types';
import { getErrorMessage } from '@/shared/lib/errors';

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
          Tartibli dars ketma-ketligi. Har bir dars mavjud Qur’on, podcast, kitob yoki tadqiqotga
          bog‘lanadi — yangi diniy matn yaratilmaydi.
        </p>
      </header>

      <div
        role="status"
        className="mb-6 rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/50 px-4 py-3 text-sm text-nur-muted"
      >
        Katalog bo‘sh bo‘lishi mumkin: nashr faqat haqiqiy, published kontentga bog‘langan
        darslar bilan.
      </div>

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
          Hozircha nashr qilingan o‘quv yo‘li yo‘q. Admin orqali, mavjud kontentga bog‘lab
          qo‘shiladi.
        </p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {items.map((path) => (
          <li key={path.id}>
            <Link
              to={`/curriculum/${path.slug}`}
              className="block py-4 transition-colors hover:bg-nur-sunken/40"
            >
              <p className="font-medium">{path.title}</p>
              <p className="mt-1 text-sm text-nur-muted line-clamp-2">{path.summary}</p>
              <p className="mt-2 text-xs text-nur-faint">
                {path.authors.join(', ')} · {path.moduleCount} modul · {path.lessonCount} dars
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
