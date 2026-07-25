import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchQuranProgress, fetchSurahs } from '@/features/quran/api/quranApi';
import type { QuranProgress, SurahSummary } from '@/features/quran/types/quran.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/lib/errors';

export function SurahListPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [progress, setProgress] = useState<QuranProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [deferredQuery]);

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
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-nur-ink">Qur’on</h1>
        <p className="mt-2 text-sm text-nur-muted">
          Matn: quran-uthmani · Tarjima: Muhammad Sodik Muhammad Yusuf (uz.sodik)
        </p>
      </header>

      {continueHref ? (
        <Link
          to={continueHref}
          className="mb-6 flex items-center justify-between gap-3 border-b border-nur-line pb-4 text-sm"
        >
          <span className="text-nur-muted">Davom etish</span>
          <span className="font-medium text-nur-accent">
            Surah {progress?.surahNumber} · oyat {progress?.ayahNumber}
          </span>
        </Link>
      ) : null}

      <label className="relative mb-6 block">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-nur-faint"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Surah nomi yoki raqami…"
          className="w-full rounded-[var(--radius-m)] border border-nur-line bg-nur-elevated py-3 pr-3 pl-10 text-sm"
        />
      </label>

      {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}
      {loading ? <p className="text-sm text-nur-muted">Yuklanmoqda…</p> : null}

      {!loading && surahs.length === 0 ? (
        <p className="text-sm text-nur-muted">
          Surah topilmadi. Avval API’da <code>npm run import:quran</code> ishga tushirilganini
          tekshiring.
        </p>
      ) : null}

      <ul className="divide-y divide-nur-line">
        {surahs.map((surah) => (
          <li key={surah.number}>
            <Link
              to={`/quran/${surah.number}`}
              className="flex items-center gap-4 py-4 transition-colors hover:bg-nur-sunken/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-nur-line text-sm text-nur-muted">
                {surah.number}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-nur-ink">{surah.nameLatin}</p>
                  <p className="font-quran text-lg text-nur-ink" dir="rtl" lang="ar">
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
    </section>
  );
}
