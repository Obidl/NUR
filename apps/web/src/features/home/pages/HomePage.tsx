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
import { TodayMission } from '@/features/home/components/TodayMission';
import {
  dayThemeFromModuleTitle,
  formatHomeDates,
  mergeProgressUpdate,
  pickTodayModule,
} from '@/features/home/lib/todayPath';
import { getErrorMessage } from '@/shared/lib/errors';

const FALLBACK_SLUGS = ['siyrat-15-kun', 'example-demo-path'] as const;

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

        let slug =
          FALLBACK_SLUGS.map((s) => items.find((item) => item.slug === s)?.slug).find(Boolean) ??
          items[0].slug;

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

  const completedIds = useMemo(
    () => new Set(progress?.completedLessonIds ?? []),
    [progress],
  );
  const today = useMemo(
    () => (path ? pickTodayModule(path, completedIds) : null),
    [path, completedIds],
  );
  const dayTheme = dayThemeFromModuleTitle(today?.moduleTitle);

  async function markComplete(lessonId: string) {
    if (!path) return;
    if (!accessToken) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await completeCurriculumLesson(path.id, lessonId);
      setProgress(mergeProgressUpdate(progress, updated, path));
    } catch (err) {
      setError(getErrorMessage(err, 'Progress saqlanmadi'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (!path || !today) {
    return (
      <section className="nur-atmosphere mx-auto max-w-lg px-4 py-16">
        <p className="font-display text-4xl tracking-[0.2em]">NUR</p>
        <h1 className="mt-6 text-2xl font-medium">Assalomu alaykum</h1>
        <p className="mt-3 text-nur-muted">Hali o‘quv yo‘li yo‘q.</p>
        <Button to="/quran" className="mt-6">
          Qur’onga o‘tish
        </Button>
        {error ? <p className="mt-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}
      </section>
    );
  }

  return (
    <section
      data-theme="dark"
      className="relative min-h-[calc(100dvh-3.5rem)] bg-nur-bg text-nur-ink md:min-h-[calc(100dvh-4rem)]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.6 }}
      >
        <div className="absolute left-1/2 top-[-8%] h-[40vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--nur-lamp-soft)_0%,transparent_70%)] opacity-70" />
      </motion.div>

      <motion.div
        className="relative mx-auto px-4 py-10 pb-28 md:px-6 md:pb-16"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {error ? <p className="mb-4 text-center text-sm text-[var(--nur-danger)]">{error}</p> : null}
        <TodayMission
          greetingName={user?.displayName}
          dates={dates}
          dayIndex={today.dayIndex}
          dayTotal={today.dayTotal}
          dayLabel={dayTheme}
          pathSlug={path.slug}
          lessons={today.lessons}
          completedIds={completedIds}
          saving={saving}
          requireLogin={!accessToken}
          onComplete={(lessonId) => {
            if (!accessToken) {
              navigate('/login', { state: { from: '/' } });
              return;
            }
            void markComplete(lessonId);
          }}
        />
      </motion.div>
    </section>
  );
}
