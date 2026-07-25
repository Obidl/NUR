import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  completeCurriculumLesson,
  fetchCurriculumPath,
  fetchCurriculumPaths,
  fetchCurriculumProgress,
} from '@/features/curriculum/api/curriculumApi';
import type { PathDetail, PathProgressItem } from '@/features/curriculum/types/curriculum.types';
import { TodayJourney } from '@/features/home/components/TodayJourney';
import {
  dayThemeFromModuleTitle,
  flattenPathLessons,
  formatHomeDates,
  mergeProgressUpdate,
  pathProgressPercent,
  pickTodayLessons,
} from '@/features/home/lib/todayPath';
import { getErrorMessage } from '@/shared/lib/errors';

const PREFERRED_SLUG = 'example-demo-path';

export function HomePage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const dates = useMemo(() => formatHomeDates(), []);

  const [path, setPath] = useState<PathDetail | null>(null);
  const [progress, setProgress] = useState<PathProgressItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayCompleteBanner, setDayCompleteBanner] = useState<{
    dayIndex: number;
    nextTheme: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { items } = await fetchCurriculumPaths();
        if (cancelled) return;
        if (!items.length) {
          setPath(null);
          setProgress(null);
          return;
        }

        let slug = items.find((item) => item.slug === PREFERRED_SLUG)?.slug ?? items[0].slug;

        if (accessToken) {
          const rows = await fetchCurriculumProgress();
          if (cancelled) return;
          const active = rows.find((row) => row.path?.slug);
          if (active?.path?.slug) slug = active.path.slug;
          const detail = await fetchCurriculumPath(slug);
          if (cancelled) return;
          setPath(detail.path);
          setProgress(rows.find((row) => row.pathId === detail.path.id) ?? null);
        } else {
          const detail = await fetchCurriculumPath(slug);
          if (cancelled) return;
          setPath(detail.path);
          setProgress(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Yo‘l yuklanmadi'));
          setPath(null);
          setProgress(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const lessons = useMemo(() => (path ? flattenPathLessons(path) : []), [path]);
  const completedIds = useMemo(
    () => new Set(progress?.completedLessonIds ?? []),
    [progress],
  );
  const today = useMemo(
    () => (path ? pickTodayLessons(path, completedIds) : null),
    [path, completedIds],
  );
  const todayLessons = today?.lessons ?? [];
  const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const percent = pathProgressPercent(lessons.length, completedCount);
  const nextLesson = todayLessons[0] ?? null;
  const dayTheme = dayThemeFromModuleTitle(today?.moduleTitle);

  async function markComplete(lessonId: string) {
    if (!path || !today) return;
    if (!accessToken) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    const finishingDay =
      todayLessons.length === 1 && todayLessons[0]?.id === lessonId;
    const finishedDayIndex = today.dayIndex;
    const modules = path.modules.slice().sort((a, b) => a.order - b.order);
    const nextModule = modules[finishedDayIndex] ?? null;

    setSaving(true);
    setError(null);
    try {
      const updated = await completeCurriculumLesson(path.id, lessonId);
      setProgress(mergeProgressUpdate(progress, updated, path));
      if (finishingDay) {
        setDayCompleteBanner({
          dayIndex: finishedDayIndex,
          nextTheme: dayThemeFromModuleTitle(nextModule?.title ?? null),
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Progress saqlanmadi'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="nur-atmosphere relative min-h-[calc(100dvh-3.5rem)] overflow-hidden md:min-h-[calc(100dvh-4rem)]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeOut' }}
      >
        <div className="absolute left-1/2 top-[-12%] h-[55vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--nur-lamp-soft)_0%,transparent_68%)] opacity-80" />
      </motion.div>

      <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-16 md:px-6 md:pb-16">
        {import.meta.env.DEV ? (
          <div
            role="status"
            className="mb-8 max-w-xl rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/60 px-4 py-3 text-sm text-nur-muted"
          >
            <p className="font-medium text-nur-ink">Lokal demo</p>
            <p className="mt-1">
              EXAMPLE kontent production emas. Qur’on — import qilingan dataset; qolganlari
              namunaviy seed.
            </p>
          </div>
        ) : null}

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-[calc(100dvh-12rem)] max-w-xl flex-col justify-center md:min-h-[70vh]"
        >
          <p className="text-xs text-nur-faint">
            {dates.hijri ? `${dates.hijri} · ` : ''}
            {dates.gregorian}
          </p>
          <p className="mt-4 font-display text-5xl tracking-[0.22em] text-nur-ink md:text-6xl">
            NUR
          </p>
          <h1 className="mt-6 text-2xl font-medium text-nur-ink md:text-3xl">
            {user ? `Assalomu alaykum, ${user.displayName}` : 'Assalomu alaykum'}
          </h1>
          <p className="mt-4 max-w-md text-base text-nur-muted md:text-lg">
            {loading
              ? 'Yuklanmoqda…'
              : path
                ? percent >= 100
                  ? 'Yo‘l tugadi. Ertaga yangi kun.'
                  : today
                    ? `Kun ${today.dayIndex}/${today.dayTotal} tayyor — oching, tinglang, belgilang.`
                    : 'Bugungi yo‘l tayyor — oching, tinglang, belgilang.'
                : 'Tinich, ishonchli islomiy o‘qish va tinglash.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {nextLesson?.targetHref ? (
              <Button to={nextLesson.targetHref}>Davom etish</Button>
            ) : path ? (
              <Button to={`/curriculum/${path.slug}`}>Yo‘lni ochish</Button>
            ) : (
              <Button to="/quran">Qur’onga o‘tish</Button>
            )}
            {accessToken ? (
              <Button to="/curriculum" variant="secondary">
                Yo‘llar
              </Button>
            ) : (
              <Button to="/login" variant="secondary">
                Kirish
              </Button>
            )}
          </div>
          {error ? <p className="mt-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}
        </motion.div>

        {path && !loading ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-4 border-t border-nur-line/80 pt-12 pb-8"
          >
            <TodayJourney
              pathTitle={path.title}
              pathSlug={path.slug}
              percent={percent}
              completedCount={completedCount}
              totalCount={lessons.length}
              dayIndex={today?.dayIndex ?? 1}
              dayTotal={today?.dayTotal ?? 15}
              dayLabel={dayTheme}
              lessons={todayLessons}
              completedIds={completedIds}
              saving={saving}
              requireLogin={!accessToken}
              dayCompleteBanner={dayCompleteBanner}
              onComplete={(lessonId) => {
                if (!accessToken) {
                  navigate('/login', { state: { from: '/' } });
                  return;
                }
                void markComplete(lessonId);
              }}
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
