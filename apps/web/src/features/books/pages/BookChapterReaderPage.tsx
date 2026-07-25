import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Highlighter, Trash2 } from 'lucide-react';
import {
  createBookBookmark,
  createBookHighlight,
  deleteBookBookmark,
  deleteBookHighlight,
  fetchBookBookmarks,
  fetchBookHighlights,
  fetchChapter,
  saveBookProgress,
  updateBookHighlight,
} from '@/features/books/api/bookApi';
import { renderSafeChapterHtml } from '@/features/books/lib/safeRender';
import type { BookBookmark, BookChapterDetail, BookHighlight } from '@/features/books/types/book.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

export function BookChapterReaderPage() {
  const { slug = '', chapterSlug = '' } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const articleRef = useRef<HTMLElement | null>(null);

  const [detail, setDetail] = useState<BookChapterDetail | null>(null);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [highlights, setHighlights] = useState<BookHighlight[]>([]);
  const [selection, setSelection] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingHighlight, setSavingHighlight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const chapter = await fetchChapter(slug, chapterSlug);
        if (cancelled) return;
        setDetail(chapter);
        if (accessToken) {
          const [marks, marksHighlights] = await Promise.all([
            fetchBookBookmarks(),
            fetchBookHighlights({ chapterId: chapter.chapter.id }),
          ]);
          if (!cancelled) {
            setBookmarks(
              marks.filter(
                (mark) =>
                  mark.bookId === chapter.book.id && mark.chapterId === chapter.chapter.id,
              ),
            );
            setHighlights(marksHighlights);
          }
        } else {
          setBookmarks([]);
          setHighlights([]);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Bob yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, chapterSlug, accessToken]);

  useEffect(() => {
    if (!detail || !accessToken) return;

    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const scrollRatio = total > 0 ? scrolled / total : 0;
      void saveBookProgress({
        bookId: detail.book.id,
        chapterId: detail.chapter.id,
        position: { scrollRatio },
      }).catch(() => undefined);
    };

    const handle = window.setInterval(onScroll, 4000);
    return () => window.clearInterval(handle);
  }, [detail, accessToken]);

  const safeHtml = useMemo(() => {
    if (!detail) return '';
    return renderSafeChapterHtml(detail.chapter.body, detail.chapter.bodyFormat);
  }, [detail]);

  const chapterBookmark = bookmarks[0];

  function captureSelection() {
    const text = window.getSelection()?.toString().trim() ?? '';
    if (!text) return;
    if (!accessToken) {
      navigate('/login', { state: { from: `/books/${slug}/${chapterSlug}` } });
      return;
    }
    setSelection(text.slice(0, 2000));
    setDraftNote('');
  }

  async function toggleBookmark() {
    if (!detail) return;
    if (!accessToken) {
      navigate('/login', { state: { from: `/books/${slug}/${chapterSlug}` } });
      return;
    }
    try {
      if (chapterBookmark) {
        await deleteBookBookmark(chapterBookmark.id);
        setBookmarks([]);
      } else {
        const created = await createBookBookmark({
          bookId: detail.book.id,
          chapterId: detail.chapter.id,
        });
        setBookmarks([created]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveHighlight() {
    if (!detail || !selection.trim()) return;
    setSavingHighlight(true);
    setError(null);
    try {
      const created = await createBookHighlight({
        bookId: detail.book.id,
        chapterId: detail.chapter.id,
        selectedText: selection.trim(),
        note: draftNote.trim() || null,
      });
      setHighlights((prev) => [created, ...prev]);
      setSelection('');
      setDraftNote('');
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingHighlight(false);
    }
  }

  async function saveEditedNote(id: string) {
    try {
      const updated = await updateBookHighlight(id, { note: editNote.trim() || null });
      setHighlights((prev) => prev.map((row) => (row.id === id ? updated : row)));
      setEditingId(null);
      setEditNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeHighlight(id: string) {
    try {
      await deleteBookHighlight(id);
      setHighlights((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (error && !detail) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--nur-danger)]">{error}</p>
        <Button to="/books" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  if (!detail) return null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Link to={`/books/${detail.book.slug}`} className="text-sm text-nur-muted">
            ← {detail.book.title}
          </Link>
          <h1 className="mt-3 text-2xl font-medium">{detail.chapter.title}</h1>
          <p className="mt-1 text-xs text-nur-muted">
            {detail.book.authors.join(', ')}
            {detail.book.translator ? ` · tarj. ${detail.book.translator}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-s)] text-nur-lamp hover:bg-nur-lamp-soft"
            aria-label="Belgilash"
            title="Matnni belgilab, highlight qo‘shing"
            onClick={captureSelection}
          >
            <Highlighter size={18} />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-s)] text-nur-lamp hover:bg-nur-lamp-soft"
            aria-label="Xatcho‘p"
            onClick={() => void toggleBookmark()}
          >
            {chapterBookmark ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}

      {selection ? (
        <div className="mb-6 rounded-[var(--radius-m)] border border-nur-line bg-nur-surface p-4">
          <p className="text-xs uppercase tracking-wide text-nur-muted">Tanlangan matn</p>
          <p className="mt-2 font-reading text-sm leading-7 text-nur-ink">“{selection}”</p>
          <label className="mt-3 block text-sm text-nur-muted" htmlFor="highlight-note">
            Shaxsiy eslatma (ixtiyoriy)
          </label>
          <textarea
            id="highlight-note"
            className="mt-1 w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
            rows={2}
            maxLength={1000}
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              disabled={savingHighlight}
              onClick={() => void saveHighlight()}
            >
              Saqlash
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelection('');
                setDraftNote('');
              }}
            >
              Bekor
            </Button>
          </div>
        </div>
      ) : null}

      <article
        ref={articleRef}
        className="font-reading text-base leading-8 text-nur-ink md:text-[1.125rem] md:leading-9"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onMouseUp={captureSelection}
        onTouchEnd={captureSelection}
      />

      {accessToken ? (
        <div className="mt-10 border-t border-nur-line pt-6">
          <h2 className="text-sm font-medium text-nur-ink">Highlightlar</h2>
          {highlights.length === 0 ? (
            <p className="mt-2 text-sm text-nur-muted">
              Matndan belgilang yoki Highlighter tugmasini bosing.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {highlights.map((row) => (
                <li key={row.id} className="rounded-[var(--radius-m)] bg-nur-lamp-soft/40 px-4 py-3">
                  <p className="font-reading text-sm leading-7 text-nur-ink">“{row.selectedText}”</p>
                  {editingId === row.id ? (
                    <div className="mt-2">
                      <textarea
                        className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
                        rows={2}
                        maxLength={1000}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                      />
                      <div className="mt-2 flex gap-2">
                        <Button type="button" onClick={() => void saveEditedNote(row.id)}>
                          Saqlash
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditNote('');
                          }}
                        >
                          Bekor
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {row.note ? (
                        <p className="mt-2 text-xs text-nur-muted">{row.note}</p>
                      ) : (
                        <p className="mt-2 text-xs text-nur-faint">Eslatma yo‘q</p>
                      )}
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          className="text-xs text-nur-lamp"
                          onClick={() => {
                            setEditingId(row.id);
                            setEditNote(row.note ?? '');
                          }}
                        >
                          Eslatmani tahrirlash
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-[var(--nur-danger)]"
                          onClick={() => void removeHighlight(row.id)}
                        >
                          <Trash2 size={12} />
                          O‘chirish
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
