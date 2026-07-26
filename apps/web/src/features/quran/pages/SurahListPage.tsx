import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  fetchQuranProgress,
  fetchSurahs,
  searchAyahs,
} from '@/features/quran/api/quranApi';
import type {
  AyahSearchHit,
  QuranProgress,
  SurahSummary,
} from '@/features/quran/types/quran.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

type SearchMode = 'surahs' | 'ayahs';

export function SurahListPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [mode, setMode] = useState<SearchMode>('surahs');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [ayahHits, setAyahHits] = useState<AyahSearchHit[]>([]);
  const [progress, setProgress] = useState<QuranProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'surahs') {
          const data = await fetchSurahs(deferredQuery || undefined);
          if (!cancelled) {
            setSurahs(data);
            setAyahHits([]);
          }
        } else {
          const trimmed = deferredQuery.trim();
          if (trimmed.length < 2) {
            if (!cancelled) {
              setAyahHits([]);
              setSurahs([]);
            }
          } else {
            const hits = await searchAyahs(trimmed, 30);
            if (!cancelled) {
              setAyahHits(hits);
              setSurahs([]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              mode === 'surahs' ? 'Surahlar yuklanmadi' : 'Oyat qidiruvi muvaffaqiyatsiz',
            ),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [deferredQuery, reloadKey, mode]);

  useEffect(() => {
    if (!accessToken) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    void fetchQuranProgress()
      .then((rows) => {
        if (cancelled) return;
        const read = rows.find((row) => row.mode === 'read') ?? rows[0] ?? null;
        setProgress(read);
      })
      .catch(() => {
        if (!cancelled) setProgress(null);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const continueHref = useMemo(() => {
    if (!progress) return null;
    return `/quran/${progress.surahNumber}?ayah=${progress.ayahNumber}`;
  }, [progress]);

  const modes: Array<{ id: SearchMode; label: string }> = [
    { id: 'surahs', label: 'Surahlar' },
    { id: 'ayahs', label: 'Oyatlar' },
  ];

  return (
    <PageShell
      title="Qur’on"
      description="Matn: quran-uthmani · Tarjima: Muhammad Sodiq Muhammad Yusuf (uz.sodik, kirill)"
    >
      {continueHref && progress ? (
        <Link
          to={continueHref}
          className="nur-surface mb-6 flex items-center justify-between gap-3 px-4 py-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
        >
          <span className="text-sm text-nur-muted">Davom etish</span>
          <span className="min-w-0 text-right text-sm font-semibold text-nur-accent">
            <span className="block truncate">
              {progress.surahName ?? `Surah ${progress.surahNumber}`}
            </span>
            <span className="mt-0.5 block text-xs font-normal text-nur-muted">
              {progress.ayahNumber}-oyat
              {progress.nameArabic ? (
                <span className="font-quran ms-2" dir="rtl" lang="ar">
                  {progress.nameArabic}
                </span>
              ) : null}
            </span>
          </span>
        </Link>
      ) : null}

      <div
        className="mb-4 flex gap-1 rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated p-1"
        role="tablist"
        aria-label="Qur’on qidiruv turi"
      >
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => {
              setMode(item.id);
              setError(null);
            }}
            className={cx(
              'flex-1 rounded-[var(--radius-m)] px-3 py-2 text-sm font-medium transition-colors',
              mode === item.id
                ? 'bg-nur-sunken text-nur-ink shadow-[var(--shadow-xs)]'
                : 'text-nur-muted hover:text-nur-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="relative mb-6 block">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-nur-faint"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            mode === 'surahs'
              ? 'Surah nomi yoki raqami…'
              : 'Oyat matni (arabcha yoki kirill tarjima)…'
          }
          className="nur-input pl-10"
          aria-label={mode === 'surahs' ? 'Surah qidiruv' : 'Oyat qidiruv'}
        />
      </label>

      {mode === 'ayahs' && query.trim().length > 0 && query.trim().length < 2 ? (
        <p className="mb-4 text-xs text-nur-faint">Kamida 2 belgi kiriting.</p>
      ) : null}

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={8} /> : null}

      {!loading && !error && mode === 'surahs' && surahs.length === 0 ? (
        <EmptyState
          title="Surah topilmadi"
          description="Qidiruvni o‘zgartiring yoki API’da Qur’on import qilinganini tekshiring."
        />
      ) : null}

      {!loading &&
      !error &&
      mode === 'ayahs' &&
      query.trim().length >= 2 &&
      ayahHits.length === 0 ? (
        <EmptyState
          title="Oyat topilmadi"
          description="Arabcha so‘z yoki kirill tarjima bilan qidirib ko‘ring."
        />
      ) : null}

      {!loading && mode === 'surahs' && surahs.length > 0 ? (
        <ul className="nur-list">
          {surahs.map((surah) => (
            <li key={surah.number}>
              <Link to={`/quran/${surah.number}`} className="nur-list-row">
                <span
                  className={cx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/50 text-sm font-medium text-nur-muted',
                  )}
                >
                  {surah.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold tracking-[-0.01em] text-nur-ink">
                      {surah.nameUz ?? surah.nameLatin}
                    </p>
                    <p className="font-quran shrink-0 text-lg text-nur-ink" dir="rtl" lang="ar">
                      {surah.nameArabic}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-nur-muted">
                    {surah.ayahCount} oyat ·{' '}
                    {surah.revelationType === 'meccan' ? 'Makkiy' : 'Madaniy'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && mode === 'ayahs' && ayahHits.length > 0 ? (
        <ul className="nur-list">
          {ayahHits.map((hit) => (
            <li key={`${hit.surahNumber}-${hit.ayahNumber}`}>
              <Link
                to={`/quran/${hit.surahNumber}?ayah=${hit.ayahNumber}`}
                className="nur-list-row items-start"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/50 text-xs font-medium text-nur-muted">
                  {hit.surahNumber}:{hit.ayahNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-nur-lamp">
                    {hit.surahName ?? `Surah ${hit.surahNumber}`} · {hit.ayahNumber}-oyat
                  </p>
                  <p
                    className="font-quran mt-1 text-right text-base leading-8 text-nur-ink"
                    dir="rtl"
                    lang="ar"
                  >
                    {hit.textArabic}
                  </p>
                  {hit.textUz ? (
                    <p className="mt-1 line-clamp-2 text-sm text-nur-muted" lang="uz-Cyrl">
                      {hit.textUz}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
