import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchBook } from '@/features/books/api/bookApi';
import type { BookCard, BookChapterSummary } from '@/features/books/types/book.types';
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
    <section className="nur-page nur-fade-in">
      <DetailBackLink to="/books">Kitoblar</DetailBackLink>

      <div className="mt-8 flex gap-5">
        <img
          src={book.coverUrl}
          alt=""
          className="h-36 w-24 rounded-[var(--radius-xl)] object-cover shadow-[var(--shadow-sm)]"
        />
        <div className="min-w-0">
          <h1 className="nur-page-title !text-[1.5rem] md:!text-[1.75rem]">{book.title}</h1>
          <p className="mt-2 text-sm text-nur-muted">{book.authors.join(', ')}</p>
          {book.translator ? (
            <p className="mt-1 text-xs text-nur-faint">Tarjimon: {book.translator}</p>
          ) : null}
        </div>
      </div>

      <p className="mt-8 text-sm leading-7 text-nur-muted">{book.description}</p>
      {rightsNote ? <p className="mt-3 text-xs text-nur-faint">{rightsNote}</p> : null}

      <h2 className="nur-section-title mt-10 mb-3">Boblar ({chapters.length})</h2>
      {chapters.length === 0 ? (
        <p className="text-sm text-nur-muted">Hali bob yo‘q.</p>
      ) : (
        <ul className="nur-list">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                to={`/books/${book.slug}/${chapter.slug}`}
                className="nur-list-row justify-between"
              >
                <span className="text-sm font-semibold tracking-[-0.01em]">
                  {chapter.order}. {chapter.title}
                </span>
                <span className="text-xs font-medium text-nur-accent">O‘qish</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
