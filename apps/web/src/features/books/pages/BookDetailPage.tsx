import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { fetchBook } from '@/features/books/api/bookApi';
import type { BookCard, BookChapterSummary } from '@/features/books/types/book.types';
import { CoverImage } from '@/shared/components/CoverImage';
import { Button } from '@/shared/components/Button';
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';

export function BookDetailPage() {
  const { slug = '' } = useParams();
  const [book, setBook] = useState<BookCard | null>(null);
  const [chapters, setChapters] = useState<BookChapterSummary[]>([]);
  const [rightsNote, setRightsNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchBook(slug);
        if (cancelled) return;
        setBook(detail.book);
        setChapters(detail.chapters);
        setRightsNote(detail.rights.licenseNotes);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Kitob topilmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <DetailLoading cover />;

  if (error || !book) {
    return (
      <section className="nur-page">
        <ErrorState message={error ?? 'Topilmadi'} />
        <Button to="/books" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  return (
    <section className="nur-fade-in">
      {/* Hero with atmosphere */}
      <div className="nur-atmosphere px-5 pt-8 pb-10 md:px-8 md:pt-12 md:pb-14">
        <div className="mx-auto max-w-2xl">
          <DetailBackLink to="/books">Kitoblar</DetailBackLink>

          <div className="mt-8 flex gap-6 md:gap-8">
            {/* Cover */}
            <div className="shrink-0">
              <CoverImage
                src={book.coverUrl}
                alt={book.title}
                className="h-44 w-[7.5rem] rounded-[var(--radius-xl)] object-cover shadow-lg md:h-56 md:w-40"
              />
            </div>

            {/* Meta */}
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="font-display text-2xl font-medium tracking-[-0.025em] text-nur-ink md:text-[2rem] md:leading-[1.15]">
                {book.title}
              </h1>
              <p className="mt-3 text-sm font-medium text-nur-muted">
                {book.authors.join(', ')}
              </p>
              {book.translator ? (
                <p className="mt-1 text-xs text-nur-faint">Tarjimon: {book.translator}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="nur-pill bg-nur-lamp-soft text-nur-lamp-ink">
                  <BookOpen size={12} />
                  {chapters.length} bob
                </span>
                {book.categories.map((cat) => (
                  <span
                    key={cat}
                    className="nur-pill bg-nur-accent-soft text-nur-accent"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {chapters.length > 0 ? (
                <Link
                  to={`/books/${book.slug}/${chapters[0]!.slug}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-m)] bg-nur-lamp px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-[0.97]"
                >
                  O'qishni boshlash
                  <ChevronRight size={14} />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-10">
        <p className="text-sm leading-7 text-nur-muted">{book.description}</p>
        {rightsNote ? (
          <p className="mt-2 text-xs text-nur-faint">{rightsNote}</p>
        ) : null}

        <h2 className="nur-section-title mt-10 mb-4">
          Boblar
          <span className="ml-2 text-sm font-normal text-nur-faint">({chapters.length})</span>
        </h2>

        {chapters.length === 0 ? (
          <p className="text-sm text-nur-muted">Hali bob yo'q.</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-nur-line bg-nur-elevated shadow-xs">
            {chapters.map((chapter, idx) => (
              <Link
                key={chapter.id}
                to={`/books/${book.slug}/${chapter.slug}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-nur-sunken/50"
                style={idx > 0 ? { borderTop: '1px solid var(--nur-line)' } : undefined}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nur-lamp-soft text-xs font-bold tabular-nums text-nur-lamp-ink">
                  {chapter.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold tracking-[-0.01em] text-nur-ink group-hover:text-nur-accent transition-colors duration-150">
                    {chapter.title}
                  </span>
                </span>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-nur-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-nur-accent"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
