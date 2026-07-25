import { Children, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchLibraryBookmarks,
  fetchLibraryContinue,
  fetchLibraryFavorites,
} from '@/features/library/api/libraryApi';
import type {
  LibraryBookmarks,
  LibraryContinue,
  LibraryFavorites,
} from '@/features/library/types/library.types';
import { getErrorMessage } from '@/shared/lib/errors';

type Tab = 'continue' | 'favorites' | 'bookmarks';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>('continue');
  const [continueData, setContinueData] = useState<LibraryContinue | null>(null);
  const [favorites, setFavorites] = useState<LibraryFavorites | null>(null);
  const [bookmarks, setBookmarks] = useState<LibraryBookmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cont, fav, marks] = await Promise.all([
          fetchLibraryContinue(),
          fetchLibraryFavorites(),
          fetchLibraryBookmarks(),
        ]);
        if (cancelled) return;
        setContinueData(cont);
        setFavorites(fav);
        setBookmarks(marks);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Kutubxona yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'continue', label: 'Davom' },
    { id: 'favorites', label: 'Sevimlilar' },
    { id: 'bookmarks', label: 'Xatcho‘plar' },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 pb-24 md:px-6 md:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-medium">Kutubxona</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Shaxsiy holat — davom, sevimlilar va xatcho‘plar.
        </p>
      </header>

      <div className="mb-6 flex gap-1 border-b border-nur-line" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? 'border-b-2 border-nur-lamp px-3 py-2 text-sm text-nur-ink'
                : 'px-3 py-2 text-sm text-nur-muted'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}
      {loading ? <p className="text-sm text-nur-muted">Yuklanmoqda…</p> : null}

      {!loading && tab === 'continue' && continueData ? (
        <div className="space-y-8">
          <Section title="Qur’on" empty="Qur’on progressi yo‘q." count={continueData.quran.length}>
            {continueData.quran.map((item) => (
              <li key={`${item.mode}-${item.surahNumber}`}>
                <Link
                  to={`/quran/${item.surahNumber}?ayah=${item.ayahNumber}`}
                  className="block py-3 hover:text-nur-accent"
                >
                  <span className="font-medium">{item.surahName}</span>
                  <span className="mt-1 block text-xs text-nur-muted">
                    {item.ayahNumber}-oyat · {item.mode === 'listen' ? 'Tinglash' : 'O‘qish'}
                  </span>
                </Link>
              </li>
            ))}
          </Section>

          <Section
            title="Podcastlar"
            empty="Podcast progressi yo‘q."
            count={continueData.podcasts.length}
          >
            {continueData.podcasts.map((item) => (
              <li key={item.episodeId}>
                <Link
                  to={`/podcasts/${item.seriesSlug}?episode=${item.episodeId}`}
                  className="block py-3 hover:text-nur-accent"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="mt-1 block text-xs text-nur-muted">
                    {item.seriesTitle} · {formatTime(item.positionSeconds)} /{' '}
                    {formatTime(item.durationSeconds)}
                  </span>
                </Link>
              </li>
            ))}
          </Section>

          <Section title="Kitoblar" empty="Kitob progressi yo‘q." count={continueData.books.length}>
            {continueData.books.map((item) => (
              <li key={`${item.bookSlug}-${item.chapterSlug}`}>
                <Link
                  to={`/books/${item.bookSlug}/${item.chapterSlug}`}
                  className="block py-3 hover:text-nur-accent"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="mt-1 block text-xs text-nur-muted">{item.chapterTitle}</span>
                </Link>
              </li>
            ))}
          </Section>
        </div>
      ) : null}

      {!loading && tab === 'favorites' && favorites ? (
        <ul className="divide-y divide-nur-line">
          {favorites.podcasts.length === 0 ? (
            <li className="py-4 text-sm text-nur-muted">
              Sevimli podcast yo‘q. Seriya sahifasidan qo‘shishingiz mumkin.
            </li>
          ) : null}
          {favorites.podcasts.map((item) => (
            <li key={item.id}>
              <Link
                to={
                  item.targetType === 'series' && item.slug
                    ? `/podcasts/${item.slug}`
                    : item.slug
                      ? `/podcasts/${item.slug}?episode=${item.targetId}`
                      : '/podcasts'
                }
                className="block py-3 hover:text-nur-accent"
              >
                <span className="font-medium">{item.title}</span>
                <span className="mt-1 block text-xs text-nur-muted">
                  {item.hostOrScholar ?? item.seriesTitle ?? 'Podcast'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && tab === 'bookmarks' && bookmarks ? (
        <div className="space-y-8">
          <Section title="Qur’on" empty="Qur’on xatcho‘pi yo‘q." count={bookmarks.quran.length}>
            {bookmarks.quran.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/quran/${item.surahNumber}?ayah=${item.ayahNumber}`}
                  className="block py-3 hover:text-nur-accent"
                >
                  <span className="font-medium">{item.surahName}</span>
                  <span className="mt-1 block text-xs text-nur-muted">
                    {item.ayahNumber}-oyat
                  </span>
                </Link>
              </li>
            ))}
          </Section>

          <Section title="Kitoblar" empty="Kitob xatcho‘pi yo‘q." count={bookmarks.books.length}>
            {bookmarks.books.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/books/${item.bookSlug}/${item.chapterSlug}`}
                  className="block py-3 hover:text-nur-accent"
                >
                  <span className="font-medium">{item.bookTitle}</span>
                  <span className="mt-1 block text-xs text-nur-muted">{item.chapterTitle}</span>
                </Link>
              </li>
            ))}
          </Section>

          <Section
            title="Tadqiqot"
            empty="Tadqiqot xatcho‘pi yo‘q."
            count={bookmarks.research.length}
          >
            {bookmarks.research.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/research/${item.article.slug}`}
                  className="block py-3 hover:text-nur-accent"
                >
                  <span className="font-medium">{item.article.title}</span>
                  <span className="mt-1 block text-xs text-nur-muted">
                    {item.article.authors.join(', ')}
                  </span>
                </Link>
              </li>
            ))}
          </Section>
        </div>
      ) : null}
    </section>
  );
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-1 text-sm font-medium text-nur-muted">{title}</h2>
      {count === 0 ? (
        <p className="text-sm text-nur-faint">{empty}</p>
      ) : (
        <ul className="divide-y divide-nur-line">{Children.toArray(children)}</ul>
      )}
    </div>
  );
}
