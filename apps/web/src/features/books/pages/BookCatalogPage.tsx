import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { fetchBookProgress, fetchBooks } from '@/features/books/api/bookApi';
import type { BookCard, BookProgressItem } from '@/features/books/types/book.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CoverImage } from '@/shared/components/CoverImage';
import { EmptyState } from '@/shared/components/EmptyState';
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
    <section className="nur-fade-in">
      {/* Hero header */}
      <div className="nur-atmosphere px-5 pt-10 pb-8 md:px-8 md:pt-14 md:pb-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-medium tracking-[-0.025em] text-nur-ink md:text-4xl">
            Kitoblar
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-nur-muted">
            Tasdiqlangan islomiy asarlar — siyrat, hadis, fiqh. Har bir kitob tekshirilgan manba asosida.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nur-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kitob qidirish…"
              className="nur-input !pl-10"
              aria-label="Kitob qidiruv"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
        {/* Continue reading */}
        {continueItems.length > 0 ? (
          <div className="mb-10">
            <h2 className="nur-section-label mb-4">Davom etish</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {continueItems.map((item) => (
                <Link
                  key={`${item.bookId}-${item.chapterId}`}
                  to={`/books/${item.bookSlug}/${item.chapterSlug}`}
                  className="nur-surface-interactive flex items-center gap-3.5 px-4 py-3.5"
                >
                  <CoverImage
                    src={item.coverUrl}
                    className="h-12 w-8 shrink-0 rounded-[var(--radius-s)] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold tracking-[-0.01em] text-nur-ink">
                      {item.bookTitle}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-nur-muted">{item.chapterTitle}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-nur-faint" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-8">
            <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
          </div>
        ) : null}

        {loading ? <ListSkeleton rows={4} /> : null}

        {!loading && !error && items.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" strokeWidth={1.75} />}
            title="Hali kitob yo'q"
            description="Nashr qilingan kitob bo'sh. Admin orqali litsenziyalangan matn qo'shiladi."
            actionLabel="Bugunga"
            actionTo="/"
          />
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.slug}`}
                className="nur-surface-interactive group overflow-hidden"
              >
                {/* Cover */}
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-nur-sunken">
                  <CoverImage
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--nur-bg)]/80 via-transparent to-transparent" />
                </div>

                {/* Info */}
                <div className="px-4 pb-4 pt-3">
                  <h3 className="font-display text-base font-semibold tracking-[-0.015em] text-nur-ink line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-nur-muted line-clamp-1">
                    {book.authors.join(', ')}
                  </p>
                  {book.translator ? (
                    <p className="mt-0.5 text-[11px] text-nur-faint">
                      Tarjimon: {book.translator}
                    </p>
                  ) : null}
                  <p className="mt-2.5 text-xs leading-relaxed text-nur-muted line-clamp-2">
                    {book.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-nur-accent">
                    O'qish <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
