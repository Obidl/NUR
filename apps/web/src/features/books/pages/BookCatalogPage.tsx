import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBookProgress, fetchBooks } from '@/features/books/api/bookApi';
import type { BookCard, BookProgressItem } from '@/features/books/types/book.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/lib/errors';

export function BookCatalogPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<BookCard[]>([]);
  const [continueItems, setContinueItems] = useState<BookProgressItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchBooks({ q: query || undefined });
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Kitoblar yuklanmadi'));
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
    void fetchBookProgress()
      .then((rows) => {
        if (!cancelled) setContinueItems(rows.slice(0, 3));
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
        <h1 className="text-2xl font-medium">Kitoblar</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Faqat tasdiqlangan kitoblar. Bo‘sh katalog — fake kontent yo‘q.
        </p>
      </header>

      {continueItems.length > 0 ? (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-nur-muted">Davom etish</h2>
          <ul className="divide-y divide-nur-line">
            {continueItems.map((item) => (
              <li key={`${item.bookId}-${item.chapterId}`}>
                <Link
                  to={`/books/${item.bookSlug}/${item.chapterSlug}`}
                  className="flex justify-between gap-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.bookTitle}</span>
                    <span className="block truncate text-xs text-nur-muted">
                      {item.chapterTitle}
                    </span>
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
          Hozircha nashr qilingan kitob yo‘q. Admin orqali haqiqiy kontent qo‘shiladi.
        </p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {items.map((book) => (
          <li key={book.id}>
            <Link
              to={`/books/${book.slug}`}
              className="flex gap-4 py-4 transition-colors hover:bg-nur-sunken/40"
            >
              <img
                src={book.coverUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-20 w-14 shrink-0 rounded-[var(--radius-s)] object-cover"
              />
              <div className="min-w-0">
                <p className="font-medium">{book.title}</p>
                <p className="mt-1 text-sm text-nur-muted">{book.authors.join(', ')}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
