import { Children, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
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
import { readLocalQuranProgress } from '@/features/quran/lib/quranLocalProgress';
import { readLocalPodcastProgressList } from '@/features/podcasts/lib/podcastLocalProgress';
import { useVideoWatchStore, type VideoContinueItem } from '@/features/videos/store/videoWatchStore';
import { Button } from '@/shared/components/Button';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

type Tab = 'continue' | 'favorites' | 'bookmarks';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function guestContinueFromDevice(videoRecent: VideoContinueItem[]): LibraryContinue {
  const local = readLocalQuranProgress();
  const podcasts = readLocalPodcastProgressList()
    .filter((row) => !row.completed)
    .slice(0, 8)
    .map((row) => ({
      episodeId: row.episodeId,
      seriesSlug: row.seriesSlug,
      seriesTitle: row.seriesTitle,
      title: row.title,
      positionSeconds: row.positionSeconds,
      durationSeconds: row.durationSeconds,
      coverUrl: row.coverUrl,
      updatedAt: row.updatedAt,
    }));
  return {
    quran: local
      ? [
          {
            mode: local.mode,
            surahNumber: local.surahNumber,
            ayahNumber: local.ayahNumber,
            surahName: local.surahName ?? `Surah ${local.surahNumber}`,
            updatedAt: local.updatedAt,
          },
        ]
      : [],
    podcasts,
    videos: videoRecent.map((item) => ({
      episodeId: item.episodeId,
      seriesSlug: item.seriesSlug,
      seriesTitle: item.seriesTitle,
      title: item.episodeTitle,
      episodeNumber: item.episodeNumber,
      hostOrScholar: item.hostOrScholar,
      coverUrl: item.coverUrl,
      completed: false,
      updatedAt: item.updatedAt,
    })),
    books: [],
  };
}

function mergeLocalIntoContinue(
  server: LibraryContinue,
  videoRecent: VideoContinueItem[],
): LibraryContinue {
  const local = readLocalQuranProgress();
  let quran = server.quran;
  if (local && quran.length === 0) {
    quran = [
      {
        mode: local.mode,
        surahNumber: local.surahNumber,
        ayahNumber: local.ayahNumber,
        surahName: local.surahName ?? `Surah ${local.surahNumber}`,
        updatedAt: local.updatedAt,
      },
    ];
  }

  let podcasts = server.podcasts;
  if (podcasts.length === 0) {
    podcasts = readLocalPodcastProgressList()
      .filter((row) => !row.completed)
      .slice(0, 8)
      .map((row) => ({
        episodeId: row.episodeId,
        seriesSlug: row.seriesSlug,
        seriesTitle: row.seriesTitle,
        title: row.title,
        positionSeconds: row.positionSeconds,
        durationSeconds: row.durationSeconds,
        coverUrl: row.coverUrl,
        updatedAt: row.updatedAt,
      }));
  }

  let videos = server.videos ?? [];
  if (videos.length === 0 && videoRecent.length > 0) {
    videos = videoRecent.map((item) => ({
      episodeId: item.episodeId,
      seriesSlug: item.seriesSlug,
      seriesTitle: item.seriesTitle,
      title: item.episodeTitle,
      episodeNumber: item.episodeNumber,
      hostOrScholar: item.hostOrScholar,
      coverUrl: item.coverUrl,
      completed: false,
      updatedAt: item.updatedAt,
    }));
  }

  return { ...server, quran, podcasts, videos };
}

export function LibraryPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const videoRecent = useVideoWatchStore((s) => s.recent);
  const [tab, setTab] = useState<Tab>('continue');
  const [continueData, setContinueData] = useState<LibraryContinue | null>(null);
  const [favorites, setFavorites] = useState<LibraryFavorites | null>(null);
  const [bookmarks, setBookmarks] = useState<LibraryBookmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!accessToken) {
          if (cancelled) return;
          setContinueData(guestContinueFromDevice(videoRecent));
          setFavorites({ podcasts: [] });
          setBookmarks({ quran: [], books: [], research: [] });
          return;
        }

        const [cont, fav, marks] = await Promise.all([
          fetchLibraryContinue(),
          fetchLibraryFavorites(),
          fetchLibraryBookmarks(),
        ]);
        if (cancelled) return;
        setContinueData(mergeLocalIntoContinue(cont, videoRecent));
        setFavorites(fav);
        setBookmarks(marks);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Kutubxona yuklanmadi'));
          setContinueData(guestContinueFromDevice(videoRecent));
          setFavorites({ podcasts: [] });
          setBookmarks({ quran: [], books: [], research: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, accessToken, videoRecent]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'continue', label: 'Davom' },
    { id: 'favorites', label: 'Sevimlilar' },
    { id: 'bookmarks', label: 'Xatcho‘plar' },
  ];

  return (
    <PageShell
      title="Kutubxona"
      description={
        accessToken
          ? 'Shaxsiy holat — davom, sevimlilar va xatcho‘plar.'
          : 'Qurilmadagi davom. Sevimlilar va xatcho‘plar uchun kiring.'
      }
      className="pb-24 md:pb-8"
    >
      <div
        className="mb-8 flex gap-1 rounded-[var(--radius-l)] bg-nur-sunken/60 p-1"
        role="tablist"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cx(
              'flex-1 rounded-[var(--radius-m)] px-3 py-2.5 text-sm font-medium transition-colors duration-200',
              tab === item.id
                ? 'bg-nur-elevated text-nur-ink'
                : 'text-nur-muted hover:text-nur-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}
      {loading ? <ListSkeleton rows={4} /> : null}

      {!loading && tab === 'continue' && continueData ? (
        <div className="space-y-8">
          {!accessToken &&
          continueData.quran.length === 0 &&
          continueData.podcasts.length === 0 &&
          continueData.videos.length === 0 ? (
            <p className="text-sm text-nur-muted">
              Hali davom yo‘q. Qur’on, podcast yoki video oching — bu yerda saqlanadi.
            </p>
          ) : null}

          <Section title="Qur’on" empty="Qur’on progressi yo‘q." count={continueData.quran.length}>
            {continueData.quran.map((item) => (
              <li key={`${item.mode}-${item.surahNumber}`}>
                <Link
                  to={`/quran/${item.surahNumber}?ayah=${item.ayahNumber}`}
                  className="nur-list-row"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.surahName}</span>
                    <span className="mt-0.5 block text-xs text-nur-muted">
                      {item.ayahNumber}-oyat · {item.mode === 'listen' ? 'Tinglash' : 'O‘qish'}
                    </span>
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
                  className="nur-list-row"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-nur-muted">
                      {item.seriesTitle} · {formatTime(item.positionSeconds)} /{' '}
                      {formatTime(item.durationSeconds)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </Section>

          <Section
            title="Videolar"
            empty="Video progressi yo‘q."
            count={continueData.videos?.length ?? 0}
          >
            {(continueData.videos ?? []).map((item) => (
              <li key={item.episodeId}>
                <Link
                  to={`/videos/${item.seriesSlug}?episode=${item.episodeId}`}
                  className="nur-list-row"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-nur-muted">
                      {item.seriesTitle}
                      {item.episodeNumber != null ? ` · ${item.episodeNumber}-son` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </Section>

          {accessToken ? (
            <Section title="Kitoblar" empty="Kitob progressi yo‘q." count={continueData.books.length}>
              {continueData.books.map((item) => (
                <li key={`${item.bookSlug}-${item.chapterSlug}`}>
                  <Link
                    to={`/books/${item.bookSlug}/${item.chapterSlug}`}
                    className="nur-list-row"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-nur-muted">{item.chapterTitle}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </Section>
          ) : null}
        </div>
      ) : null}

      {!loading && tab === 'favorites' ? (
        !accessToken ? (
          <GuestAccountPrompt
            message="Sevimlilar hisobingizga bog‘lanadi."
            from="/library"
          />
        ) : favorites ? (
          favorites.podcasts.length === 0 ? (
            <p className="text-sm text-nur-muted">
              Sevimli podcast yo‘q. Seriya sahifasidan qo‘shishingiz mumkin.
            </p>
          ) : (
            <ul className="nur-list">
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
                    className="nur-list-row"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-nur-muted">
                        {item.hostOrScholar ?? item.seriesTitle ?? 'Podcast'}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null
      ) : null}

      {!loading && tab === 'bookmarks' ? (
        !accessToken ? (
          <GuestAccountPrompt
            message="Xatcho‘plar hisobingizga bog‘lanadi."
            from="/library"
          />
        ) : bookmarks ? (
          <div className="space-y-8">
            <Section title="Qur’on" empty="Qur’on xatcho‘pi yo‘q." count={bookmarks.quran.length}>
              {bookmarks.quran.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/quran/${item.surahNumber}?ayah=${item.ayahNumber}`}
                    className="nur-list-row"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.surahName}</span>
                      <span className="mt-0.5 block text-xs text-nur-muted">
                        {item.ayahNumber}-oyat
                      </span>
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
                    className="nur-list-row"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.bookTitle}</span>
                      <span className="mt-0.5 block text-xs text-nur-muted">{item.chapterTitle}</span>
                    </span>
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
                  <Link to={`/research/${item.article.slug}`} className="nur-list-row">
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.article.title}</span>
                      <span className="mt-0.5 block text-xs text-nur-muted">
                        {item.article.authors.join(', ')}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </Section>
          </div>
        ) : null
      ) : null}
    </PageShell>
  );
}

function GuestAccountPrompt({ message, from }: { message: string; from: string }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-nur-line bg-nur-elevated px-5 py-8 text-center">
      <p className="text-sm text-nur-muted">{message}</p>
      <Button to="/login" state={{ from }} className="mt-5">
        Kirish
      </Button>
    </div>
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
      <h2 className="nur-section-title mb-3">{title}</h2>
      {count === 0 ? (
        <p className="text-sm text-nur-faint">{empty}</p>
      ) : (
        <ul className="nur-list">{Children.toArray(children)}</ul>
      )}
    </div>
  );
}
