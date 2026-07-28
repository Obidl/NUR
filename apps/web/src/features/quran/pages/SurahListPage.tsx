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
      className="!bg-transparent"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--nur-quran-bg)]"
      />

      {continueHref && progress ? (
        <Link
          to={continueHref}
          className="mb-8 flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border-l-2 border-l-[var(--nur-quran-ornament)] bg-[var(--nur-quran-panel)] px-5 py-4 transition-transform duration-150 active:scale-[0.99]"
        >
          <span className="text-[0.6875rem] font-semibold tracking-[0.06em] text-[var(--nur-quran-ornament)] uppercase">
            Davom etish
          </span>
          <span className="min-w-0 text-right text-sm font-semibold text-nur-ink">
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
        className="mb-5 flex gap-1 rounded-[var(--radius-l)] bg-[var(--nur-quran-translation-plane)] p-1"
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
              'flex-1 rounded-[var(--radius-m)] px-3 py-2.5 text-sm font-medium transition-colors',
              mode === item.id
                ? 'bg-[var(--nur-quran-panel)] text-nur-ink shadow-[var(--shadow-xs)]'
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
          actionLabel={query ? 'Qidiruvni tozalash' : 'Bugunga'}
          actionTo={query ? undefined : '/'}
          onAction={query ? () => setQuery('') : undefined}
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
          actionLabel="Qidiruvni tozalash"
          onAction={() => setQuery('')}
        />
      ) : null}

      {!loading && mode === 'surahs' && surahs.length > 0 ? (
        <ul className="space-y-2.5">
          {surahs.map((surah) => {
            const isContinue = progress?.surahNumber === surah.number;
            return (
            <li key={surah.number}>
              <Link
                to={
                  isContinue && progress
                    ? `/quran/${surah.number}?ayah=${progress.ayahNumber}`
                    : `/quran/${surah.number}`
                }
                className={cx(
                  'flex items-center gap-4 rounded-[var(--radius-xl)] border bg-[var(--nur-quran-panel)] px-4 py-4 transition-transform duration-150 active:scale-[0.99]',
                  isContinue
                    ? 'border-[var(--nur-quran-ornament)]'
                    : 'border-[color-mix(in_srgb,var(--nur-quran-ornament)_16%,var(--nur-line))]',
                )}
              >
                <span
                  className={cx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-medium ring-1',
                    isContinue
                      ? 'bg-[var(--nur-quran-ornament)] text-white ring-[var(--nur-quran-ornament)]'
                      : 'bg-[var(--nur-quran-translation-plane)] text-[var(--nur-quran-ornament)] ring-[color-mix(in_srgb,var(--nur-quran-ornament)_22%,transparent)]',
                  )}
                >
                  {surah.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-display text-base font-medium tracking-[-0.015em] text-nur-ink">
                      {surah.nameUz ?? surah.nameLatin}
                      {isContinue ? (
                        <span className="ms-2 text-[0.6875rem] font-semibold tracking-[0.06em] text-[var(--nur-quran-ornament)] uppercase">
                          Davom
                        </span>
                      ) : null}
                    </p>
                    <p
                      className="font-quran shrink-0 text-xl leading-none text-nur-ink"
                      dir="rtl"
                      lang="ar"
                    >
                      {surah.nameArabic}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs text-nur-muted">
                    {surah.ayahCount} oyat ·{' '}
                    {surah.revelationType === 'meccan' ? 'Makkiy' : 'Madaniy'}
                    {isContinue && progress ? ` · ${progress.ayahNumber}-oyat` : ''}
                  </p>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && mode === 'ayahs' && ayahHits.length > 0 ? (
        <ul className="space-y-2.5">
          {ayahHits.map((hit) => (
            <li key={`${hit.surahNumber}-${hit.ayahNumber}`}>
              <Link
                to={`/quran/${hit.surahNumber}?ayah=${hit.ayahNumber}`}
                className="block rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--nur-quran-ornament)_16%,var(--nur-line))] bg-[var(--nur-quran-panel)] px-4 py-4"
              >
                <p className="text-[0.6875rem] font-semibold tracking-[0.06em] text-[var(--nur-quran-ornament)] uppercase">
                  {hit.surahName ?? `Surah ${hit.surahNumber}`} · {hit.ayahNumber}-oyat
                </p>
                <p
                  className="font-quran mt-3 rounded-[var(--radius-m)] border-r-2 border-r-[var(--nur-quran-ornament)] bg-[var(--nur-quran-arabic-plane)] px-3 py-3 text-right text-base leading-8 text-[var(--nur-quran-ink)]"
                  dir="rtl"
                  lang="ar"
                >
                  {hit.textArabic}
                </p>
                {hit.textUz ? (
                  <p
                    className="mt-3 line-clamp-2 border-l-2 border-l-[var(--nur-quran-ornament)] bg-[var(--nur-quran-translation-plane)] px-3 py-2.5 text-sm font-medium leading-relaxed text-[var(--nur-quran-ink)]"
                    lang="uz-Cyrl"
                  >
                    {hit.textUz}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
