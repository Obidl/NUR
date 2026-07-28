import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Play, Settings2 } from 'lucide-react';
import {
  createQuranBookmark,
  deleteQuranBookmark,
  fetchQuranBookmarks,
  fetchReciters,
  fetchSurah,
  saveQuranProgress,
} from '@/features/quran/api/quranApi';
import { AyahRow } from '@/features/quran/components/AyahRow';
import { useQuranPlayerStore } from '@/features/quran/store/quranPlayerStore';
import { useQuranSettingsStore } from '@/features/quran/store/quranSettingsStore';
import type {
  QuranBookmark,
  Reciter,
  SurahDetail,
} from '@/features/quran/types/quran.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

export function SurahReaderPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const surahNumber = Number(params.surahNumber);
  const initialAyah = Number(searchParams.get('ayah') ?? '1');

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const fontSize = useQuranSettingsStore((s) => s.fontSize);
  const showTranslation = useQuranSettingsStore((s) => s.showTranslation);
  const readerTheme = useQuranSettingsStore((s) => s.readerTheme);
  const setFontSize = useQuranSettingsStore((s) => s.setFontSize);
  const setShowTranslation = useQuranSettingsStore((s) => s.setShowTranslation);
  const setReaderTheme = useQuranSettingsStore((s) => s.setReaderTheme);
  const hydrateFromUserPreference = useQuranSettingsStore((s) => s.hydrateFromUserPreference);

  const setReciter = useQuranPlayerStore((s) => s.setReciter);
  const playAyah = useQuranPlayerStore((s) => s.playAyah);
  const playSurah = useQuranPlayerStore((s) => s.playSurah);
  const activeAyah = useQuranPlayerStore((s) => s.ayahNumber);
  const playerSurah = useQuranPlayerStore((s) => s.surahNumber);
  const setOnAyahBoundary = useQuranPlayerStore((s) => s.setOnAyahBoundary);

  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [selectedReciterId, setSelectedReciterId] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [focusedAyah, setFocusedAyah] = useState(initialAyah);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (user?.preferences.quranFontSize) {
      hydrateFromUserPreference(user.preferences.quranFontSize);
    }
  }, [user?.preferences.quranFontSize, hydrateFromUserPreference]);

  useEffect(() => {
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      setError('Noto‘g‘ri surah raqami');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [surahDetail, reciterList] = await Promise.all([
          fetchSurah(surahNumber),
          fetchReciters(),
        ]);
        if (cancelled) return;

        setDetail(surahDetail);
        setReciters(reciterList);

        const defaultReciter = reciterList[0];
        if (defaultReciter) {
          setSelectedReciterId(defaultReciter.id);
          setReciter(defaultReciter.id, defaultReciter.name);
        }

        if (accessToken) {
          try {
            const marks = await fetchQuranBookmarks();
            if (!cancelled) {
              setBookmarks(marks.filter((mark) => mark.surahNumber === surahNumber));
            }
          } catch {
            // optional
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Surah yuklanmadi'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [surahNumber, accessToken, setReciter]);

  useEffect(() => {
    if (!detail) return;
    const target = Math.min(Math.max(initialAyah || 1, 1), detail.ayahs.length || 1);
    setFocusedAyah(target);
    const timer = window.setTimeout(() => {
      document.getElementById(`ayah-${target}`)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [detail, initialAyah, reduceMotion]);

  const persistReadProgress = useCallback(
    async (ayahNumber: number) => {
      if (!accessToken) return;
      try {
        await saveQuranProgress({
          mode: 'read',
          surahNumber,
          ayahNumber,
        });
      } catch {
        // non-blocking
      }
    },
    [accessToken, surahNumber],
  );

  useEffect(() => {
    if (!detail || !focusedAyah) return;
    const handle = window.setTimeout(() => {
      void persistReadProgress(focusedAyah);
    }, 600);
    return () => window.clearTimeout(handle);
  }, [detail, focusedAyah, persistReadProgress]);

  useEffect(() => {
    const onBoundary = (ayahNumber: number) => {
      setFocusedAyah(ayahNumber);
      void persistReadProgress(ayahNumber);
      window.setTimeout(() => {
        document.getElementById(`ayah-${ayahNumber}`)?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'center',
        });
      }, 40);
      if (accessToken) {
        void saveQuranProgress({
          mode: 'listen',
          surahNumber,
          ayahNumber,
        }).catch(() => undefined);
      }
    };
    setOnAyahBoundary(onBoundary);
    return () => setOnAyahBoundary(null);
  }, [
    accessToken,
    persistReadProgress,
    reduceMotion,
    setOnAyahBoundary,
    surahNumber,
  ]);

  const bookmarkMap = useMemo(() => {
    const map = new Map<number, QuranBookmark>();
    for (const mark of bookmarks) {
      map.set(mark.ayahNumber, mark);
    }
    return map;
  }, [bookmarks]);

  async function toggleBookmark(ayahNumber: number) {
    if (!accessToken) {
      navigate('/login', { state: { from: `/quran/${surahNumber}?ayah=${ayahNumber}` } });
      return;
    }

    const existing = bookmarkMap.get(ayahNumber);
    try {
      if (existing) {
        await deleteQuranBookmark(existing.id);
        setBookmarks((prev) => prev.filter((mark) => mark.id !== existing.id));
      } else {
        const created = await createQuranBookmark({ surahNumber, ayahNumber });
        setBookmarks((prev) => [created, ...prev]);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Xatcho‘p saqlanmadi'));
    }
  }

  function onReciterChange(id: string) {
    setSelectedReciterId(id);
    const reciter = reciters.find((item) => item.id === id);
    if (reciter) setReciter(reciter.id, reciter.name);
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
      <section className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-[var(--nur-danger)]">{error}</p>
        <Button to="/quran" variant="secondary" className="mt-4">
          Surahlar ro‘yxatiga
        </Button>
      </section>
    );
  }

  if (!detail) return null;

  const translatorName = detail.ayahs.find((ayah) => ayah.translation)?.translation
    ?.translatorName;

  return (
    <div className="nur-quran-shell" data-quran-theme={readerTheme}>
      <header className="sticky top-0 z-20 border-b border-[color-mix(in_srgb,var(--nur-quran-ornament)_14%,var(--nur-line))] bg-[color-mix(in_srgb,var(--nur-quran-panel)_92%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link
            to="/quran"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--nur-quran-muted)] transition-colors hover:text-[var(--nur-quran-ink)]"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Surahlar
          </Link>
          <p className="min-w-0 truncate text-center font-display text-sm font-medium tracking-[-0.01em] text-[var(--nur-quran-ink)]">
            {detail.surah.number}. {detail.surah.nameUz ?? detail.surah.nameLatin}
          </p>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--nur-quran-muted)] transition-colors hover:bg-[var(--nur-quran-translation-plane)] hover:text-[var(--nur-quran-ink)]"
            aria-label="O‘qish sozlamalari"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings2 size={18} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-2xl space-y-4 px-4 pt-8 pb-8 md:px-6"
      >
        <header className="nur-quran-surah-hero mb-8">
          <p
            className="font-quran text-[1.75rem] font-medium leading-[1.9] text-[var(--nur-quran-ink)] md:text-[2.15rem]"
            dir="rtl"
            lang="ar"
          >
            {detail.surah.nameArabic}
          </p>
          <h1 className="mt-3 font-display text-xl font-medium tracking-[-0.02em] text-[var(--nur-quran-ink)] md:text-2xl">
            {detail.surah.nameUz ?? detail.surah.nameLatin}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--nur-quran-muted)]">
            {detail.surah.ayahCount} oyat
            {detail.surah.revelationType === 'meccan' ? ' · Makkiy' : ' · Madaniy'}
            {translatorName ? ` · ${translatorName}` : ''}
          </p>

          <div className="mt-7 flex justify-center">
            <Button
              type="button"
              className="!rounded-[var(--radius-pill)]"
              onClick={() => {
                if (!selectedReciterId || !detail) return;
                void playSurah(surahNumber, detail.ayahs.length);
                void persistReadProgress(1);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Play size={16} strokeWidth={1.75} fill="currentColor" />
                Surahni tinglash
              </span>
            </Button>
          </div>
        </header>

        {settingsOpen ? (
          <div className="mb-2 space-y-5 rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--nur-quran-ornament)_14%,var(--nur-line))] bg-[var(--nur-quran-panel)] p-5">
            <label className="block text-sm">
              <span className="mb-2 block text-[var(--nur-quran-muted)]">Arab shrifti: {fontSize}px</span>
              <input
                type="range"
                min={26}
                max={48}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="w-full accent-[var(--nur-accent)]"
              />
            </label>
            <label className="flex items-center gap-2.5 text-sm text-[var(--nur-quran-muted)]">
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(event) => setShowTranslation(event.target.checked)}
                className="rounded border-nur-line"
              />
              Tarjimani ko‘rsatish
              <span className="opacity-70">(kirill)</span>
            </label>
            <fieldset className="block text-sm">
              <legend className="mb-2.5 text-[var(--nur-quran-muted)]">Fon</legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'parchment', label: 'Oddiy' },
                    { id: 'mist', label: 'Sepia' },
                    { id: 'night', label: 'Tun' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReaderTheme(item.id)}
                    className={cx(
                      'rounded-[var(--radius-m)] border px-2 py-2.5 text-xs font-medium transition-colors',
                      readerTheme === item.id
                        ? 'border-nur-accent bg-nur-accent text-[var(--nur-accent-ink)]'
                        : 'border-[color-mix(in_srgb,var(--nur-quran-muted)_20%,transparent)] text-[var(--nur-quran-muted)]',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm">
              <span className="mb-2 block text-[var(--nur-quran-muted)]">Qori</span>
              <select
                value={selectedReciterId}
                onChange={(event) => onReciterChange(event.target.value)}
                className="nur-input"
              >
                {reciters.map((reciter) => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.name}
                  </option>
                ))}
              </select>
            </label>
            {!accessToken ? (
              <p className="text-xs leading-relaxed text-[var(--nur-quran-muted)]">
                Progress uchun{' '}
                <Link to="/login" className="nur-link">
                  kiring
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}

        <div className="space-y-4">
          {detail.ayahs.map((ayah) => (
            <AyahRow
              key={ayah.ayahNumber}
              ayah={ayah}
              fontSize={fontSize}
              showTranslation={showTranslation}
              isActive={
                focusedAyah === ayah.ayahNumber ||
                (playerSurah === surahNumber && activeAyah === ayah.ayahNumber)
              }
              isBookmarked={bookmarkMap.has(ayah.ayahNumber)}
              canBookmark
              onPlay={() => {
                void playAyah(surahNumber, ayah.ayahNumber, {
                  ayahCount: detail.ayahs.length,
                  autoAdvance: true,
                });
                setFocusedAyah(ayah.ayahNumber);
                void persistReadProgress(ayah.ayahNumber);
                if (accessToken) {
                  void saveQuranProgress({
                    mode: 'listen',
                    surahNumber,
                    ayahNumber: ayah.ayahNumber,
                  }).catch(() => undefined);
                }
              }}
              onToggleBookmark={() => void toggleBookmark(ayah.ayahNumber)}
              onFocus={() => setFocusedAyah(ayah.ayahNumber)}
            />
          ))}
        </div>
      </motion.section>
    </div>
  );
}
