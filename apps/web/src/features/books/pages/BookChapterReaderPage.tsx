import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  Highlighter,
  Trash2,
} from 'lucide-react';
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
import type {
  BookBookmark,
  BookChapterDetail,
  BookHighlight,
} from '@/features/books/types/book.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
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
    return <DetailLoading />;
  }

  if (error && !detail) {
    return (
      <section className="nur-page">
        <ErrorState message={error} />
        <Button to="/books" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  if (!detail) return null;

  return (
    <div className="nur-book-shell nur-fade-in">
      {/* Sticky reader nav */}
      <div className="nur-book-nav sticky top-0 z-20">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3 md:px-8">
          <Link
            to={`/books/${detail.book.slug}`}
            className="nur-book-meta flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--nur-book-ink)]"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">{detail.book.title}</span>
            <span className="sm:hidden">Orqaga</span>
          </Link>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-m)] text-[var(--nur-book-ornament)] transition-colors duration-200 hover:bg-[var(--nur-book-ornament)]/10"
              aria-label="Belgilash"
              title="Matnni belgilab, highlight qo'shing"
              onClick={captureSelection}
            >
              <Highlighter size={16} />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-m)] text-[var(--nur-book-ornament)] transition-colors duration-200 hover:bg-[var(--nur-book-ornament)]/10"
              aria-label="Xatcho'p"
              onClick={() => void toggleBookmark()}
            >
              {chapterBookmark ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Chapter header */}
      <div className="mx-auto max-w-2xl px-5 pt-12 pb-2 md:px-8 md:pt-16">
        <p className="nur-book-chapter-label text-xs font-semibold uppercase tracking-[0.15em]">
          {detail.chapter.order}-bob
        </p>
        <h1 className="nur-book-title mt-4 font-display text-[1.75rem] font-medium tracking-[-0.025em] md:text-[2.125rem] md:leading-[1.15]">
          {detail.chapter.title}
        </h1>
        <p className="nur-book-meta mt-3 text-xs leading-relaxed">
          {detail.book.authors.join(', ')}
          {detail.book.translator ? ` · tarj. ${detail.book.translator}` : ''}
        </p>
        <div className="nur-book-divider mt-8" />
      </div>

      {/* Error */}
      {error ? (
        <div className="mx-auto max-w-2xl px-5 md:px-8">
          <p className="my-4 text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        </div>
      ) : null}

      {/* Highlight capture */}
      {selection ? (
        <div className="mx-auto max-w-2xl px-5 md:px-8">
          <div className="my-6 rounded-[var(--radius-xl)] border border-[var(--nur-book-line)] bg-[var(--nur-book-panel)] px-5 py-5 shadow-xs">
            <p className="nur-section-label">Tanlangan matn</p>
            <p className="mt-2.5 font-reading text-sm leading-7">"{selection}"</p>
            <label className="mt-4 block text-sm font-medium" htmlFor="highlight-note">
              Shaxsiy eslatma (ixtiyoriy)
            </label>
            <textarea
              id="highlight-note"
              className="nur-input mt-2"
              rows={2}
              maxLength={1000}
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <Button type="button" disabled={savingHighlight} onClick={() => void saveHighlight()}>
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
        </div>
      ) : null}

      {/* Reader body */}
      <article
        ref={articleRef}
        className="nur-reader-body mx-auto max-w-2xl px-5 pt-10 pb-20 font-reading text-[1.0625rem] leading-[2] md:px-8 md:text-[1.125rem] md:leading-[2.1]"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onMouseUp={captureSelection}
        onTouchEnd={captureSelection}
      />

      {/* Chapter navigation */}
      <div className="mx-auto max-w-2xl px-5 pb-8 md:px-8">
        <div className="nur-book-divider" />
        <div className="flex items-center justify-between pt-6">
          {detail.chapter.order > 1 ? (
            <button
              type="button"
              className="nur-book-meta flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--nur-book-ink)]"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={14} />
              Oldingi bob
            </button>
          ) : (
            <span />
          )}
          <Link
            to={`/books/${detail.book.slug}`}
            className="nur-book-meta text-xs font-medium transition-colors hover:text-[var(--nur-book-ink)]"
          >
            Barcha boblar
          </Link>
        </div>
      </div>

      {/* Highlights section */}
      {accessToken ? (
        <div className="mx-auto max-w-2xl px-5 pb-14 md:px-8">
          <div className="border-t border-[var(--nur-book-line)] pt-10">
            <h2 className="nur-section-label mb-5">Belgilangan matnlar</h2>
            {highlights.length === 0 ? (
              <p className="nur-book-meta text-sm leading-relaxed">
                Matndan belgilang yoki Highlighter tugmasini bosing.
              </p>
            ) : (
              <ul className="space-y-3">
                {highlights.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[var(--radius-l)] border border-[var(--nur-book-ornament)]/20 bg-[var(--nur-book-ornament)]/5 px-4 py-3.5"
                  >
                    <p className="font-reading text-sm leading-7">
                      "{row.selectedText}"
                    </p>
                    {editingId === row.id ? (
                      <div className="mt-2">
                        <textarea
                          className="nur-input"
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
                          <p className="nur-book-meta mt-2 text-xs">{row.note}</p>
                        ) : (
                          <p className="mt-2 text-xs opacity-50">Eslatma yo'q</p>
                        )}
                        <div className="mt-2 flex gap-3">
                          <button
                            type="button"
                            className="text-xs font-medium text-[var(--nur-book-ornament)]"
                            onClick={() => {
                              setEditingId(row.id);
                              setEditNote(row.note ?? '');
                            }}
                          >
                            Tahrirlash
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-[var(--nur-danger)]"
                            onClick={() => void removeHighlight(row.id)}
                          >
                            <Trash2 size={12} />
                            O'chirish
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
