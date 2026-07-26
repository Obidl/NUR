import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { fetchBookProgress, fetchBooks } from '@/features/books/api/bookApi';
import type { BookCard, BookProgressItem } from '@/features/books/types/book.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CoverImage } from '@/shared/components/CoverImage';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Field';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';

export function BookCatalogPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<BookCard[]>([]);
  const [continueItems, setContinueItems] = useState<BookProgressItem[]>([]);
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
  }, [query, reloadKey]);

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
    <PageShell
      title="Kitoblar"
      description="Faqat tasdiqlangan kitoblar. Bo‘sh katalog — fake kontent yo‘q."
    >
      {continueItems.length > 0 ? (
        <div className="mb-8">
          <h2 className="nur-section-title mb-3">Davom etish</h2>
          <ul className="nur-list">
            {continueItems.map((item) => (
              <li key={`${item.bookId}-${item.chapterId}`}>
                <Link
                  to={`/books/${item.bookSlug}/${item.chapterSlug}`}
                  className="nur-list-row"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.bookTitle}</span>
                    <span className="mt-0.5 block truncate text-xs text-nur-muted">
                      {item.chapterTitle}
                    </span>
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
        aria-label="Kitob qidiruv"
      />

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={5} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" strokeWidth={1.75} />}
          title="Hali kitob yo‘q"
          description="Nashr qilingan kitob bo‘sh. Admin orqali litsenziyalangan matn qo‘shiladi."
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="nur-list">
          {items.map((book) => (
            <li key={book.id}>
              <Link to={`/books/${book.slug}`} className="nur-list-row">
                <CoverImage
                  src={book.coverUrl}
                  className="h-[4.5rem] w-12 shrink-0 rounded-[var(--radius-m)] object-cover "
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-[-0.01em]">{book.title}</p>
                  <p className="mt-1 truncate text-sm text-nur-muted">{book.authors.join(', ')}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
