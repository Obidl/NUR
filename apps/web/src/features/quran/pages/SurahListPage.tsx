import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchQuranProgress, fetchSurahs } from '@/features/quran/api/quranApi';
import type { QuranProgress, SurahSummary } from '@/features/quran/types/quran.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

export function SurahListPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
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
        const data = await fetchSurahs(deferredQuery || undefined);
        if (!cancelled) setSurahs(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Surahlar yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [deferredQuery, reloadKey]);

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

  return (
    <PageShell
      title="Qur’on"
      description="Matn: quran-uthmani · Tarjima: Muhammad Sodik Muhammad Yusuf (uz.sodik)"
    >
      {continueHref ? (
        <Link
          to={continueHref}
          className="nur-surface mb-6 flex items-center justify-between gap-3 px-4 py-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
        >
          <span className="text-sm text-nur-muted">Davom etish</span>
          <span className="text-sm font-semibold text-nur-accent">
            Surah {progress?.surahNumber} · oyat {progress?.ayahNumber}
          </span>
        </Link>
      ) : null}

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
          placeholder="Surah nomi yoki raqami…"
          className="nur-input pl-10"
          aria-label="Surah qidiruv"
        />
      </label>

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={8} /> : null}

      {!loading && !error && surahs.length === 0 ? (
        <EmptyState
          title="Surah topilmadi"
          description="Qidiruvni o‘zgartiring yoki API’da Qur’on import qilinganini tekshiring."
        />
      ) : null}

      {!loading && surahs.length > 0 ? (
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
                      {surah.nameLatin}
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
    </PageShell>
  );
}
