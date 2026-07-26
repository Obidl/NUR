import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Play } from 'lucide-react';
import {
  createQuranBookmark,
  deleteQuranBookmark,
  fetchQuranBookmarks,
  fetchReciters,
  fetchSurah,
  saveQuranProgress,
} from '@/features/quran/api/quranApi';
import { AyahRow } from '@/features/quran/components/AyahRow';
import { QuranAudioBar } from '@/features/quran/components/QuranAudioBar';
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
  const setFontSize = useQuranSettingsStore((s) => s.setFontSize);
  const setShowTranslation = useQuranSettingsStore((s) => s.setShowTranslation);
  const hydrateFromUserPreference = useQuranSettingsStore((s) => s.hydrateFromUserPreference);

  const setReciter = useQuranPlayerStore((s) => s.setReciter);
  const playAyah = useQuranPlayerStore((s) => s.playAyah);
  const playSurah = useQuranPlayerStore((s) => s.playSurah);
  const activeAyah = useQuranPlayerStore((s) => s.ayahNumber);
  const playerSurah = useQuranPlayerStore((s) => s.surahNumber);

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
              setBookmarks(
                marks.filter((mark) => mark.surahNumber === surahNumber),
              );
            }
          } catch {
            // Bookmarks are optional if session expired mid-flight.
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
    const target = Math.min(
      Math.max(initialAyah || 1, 1),
      detail.ayahs.length || 1,
    );
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
        // Non-blocking; user can continue reading.
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
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--nur-danger)]">{error}</p>
        <Button to="/quran" variant="secondary" className="mt-4">
          Surahlar ro‘yxatiga
        </Button>
      </section>
    );
  }

  if (!detail) return null;

  const translatorName = detail.ayahs.find((ayah) => ayah.translation)?.translation?.translatorName;

  return (
    <div className="bg-[var(--nur-quran-bg)] text-[var(--nur-quran-ink)]">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-4 pt-6 pb-28 md:px-6"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <Link
              to="/quran"
              className="mb-3 inline-flex items-center gap-1 text-sm text-nur-muted hover:text-nur-ink"
            >
              <ArrowLeft size={16} />
              Surahlar
            </Link>
            <h1 className="text-xl font-medium md:text-2xl">
              {detail.surah.number}. {detail.surah.nameUz ?? detail.surah.nameLatin}
            </h1>
            <p className="mt-1 font-quran text-2xl" dir="rtl" lang="ar">
              {detail.surah.nameArabic}
            </p>
            <p className="mt-2 text-xs text-nur-muted">
              {detail.surah.ayahCount} oyat
              {translatorName
                ? ` · Tarjima: ${translatorName} (kirill, uz.sodik)`
                : ''}
            </p>
          </div>
          <button
            type="button"
            className="rounded-[var(--radius-s)] border border-nur-line px-3 py-2 text-sm text-nur-muted"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            Sozlama
          </button>
        </div>

        {settingsOpen ? (
          <div className="mb-6 space-y-4 border border-nur-line bg-nur-elevated/70 p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-nur-muted">Shrift: {fontSize}px</span>
              <input
                type="range"
                min={16}
                max={40}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="w-full"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-nur-muted">
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(event) => setShowTranslation(event.target.checked)}
              />
              O‘zbek tarjimasini ko‘rsatish
              <span className="text-nur-faint"> (kirill)</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-nur-muted">Qori</span>
              <select
                value={selectedReciterId}
                onChange={(event) => onReciterChange(event.target.value)}
                className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
              >
                {reciters.map((reciter) => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.name}
                  </option>
                ))}
              </select>
            </label>
            {!accessToken ? (
              <p className="text-xs text-nur-muted">
                Progress va xatcho‘plar uchun{' '}
                <Link to="/login" className="text-nur-accent">
                  kiring
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!selectedReciterId || !detail) return;
              void playSurah(surahNumber, detail.ayahs.length);
              void persistReadProgress(1);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Play size={16} />
              Butun surahni tinglash
            </span>
          </Button>
        </div>

        <div>
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

      <QuranAudioBar
        onAyahBoundary={(ayahNumber) => {
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
        }}
      />
    </div>
  );
}
