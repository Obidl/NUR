import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchBook } from '@/features/books/api/bookApi';
import type { BookCard, BookChapterSummary } from '@/features/books/types/book.types';
import { Button } from '@/shared/components/Button';
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (error || !book) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--nur-danger)]">{error ?? 'Topilmadi'}</p>
        <Button to="/books" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link to="/books" className="text-sm text-nur-muted">
        ← Kitoblar
      </Link>

      <div className="mt-6 flex gap-4">
        <img
          src={book.coverUrl}
          alt=""
          className="h-36 w-24 rounded-[var(--radius-m)] object-cover"
        />
        <div>
          <h1 className="text-2xl font-medium">{book.title}</h1>
          <p className="mt-1 text-sm text-nur-muted">{book.authors.join(', ')}</p>
          {book.translator ? (
            <p className="mt-1 text-xs text-nur-muted">Tarjimon: {book.translator}</p>
          ) : null}
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 text-nur-muted">{book.description}</p>
      {rightsNote ? <p className="mt-2 text-xs text-nur-faint">{rightsNote}</p> : null}

      <h2 className="mt-10 mb-3 text-sm font-medium text-nur-muted">
        Boblar ({chapters.length})
      </h2>
      <ul className="divide-y divide-nur-line">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <Link
              to={`/books/${book.slug}/${chapter.slug}`}
              className="flex items-center justify-between py-4 hover:text-nur-accent"
            >
              <span>
                {chapter.order}. {chapter.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
