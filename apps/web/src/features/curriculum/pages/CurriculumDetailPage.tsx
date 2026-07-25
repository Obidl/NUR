import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  completeCurriculumLesson,
  fetchCurriculumPath,
  fetchCurriculumProgress,
} from '@/features/curriculum/api/curriculumApi';
import type { PathDetail, PathProgressItem } from '@/features/curriculum/types/curriculum.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';
import {
  LESSON_KIND_LABEL,
  LESSON_SLOT_LABEL,
  dayThemeFromModuleTitle,
  displayTitle,
  flattenPathLessons,
  isExampleLabel,
  mergeProgressUpdate,
  pathProgressPercent,
  pickTodayLessons,
} from '@/features/home/lib/todayPath';

export function CurriculumDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [path, setPath] = useState<PathDetail | null>(null);
  const [progress, setProgress] = useState<PathProgressItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchCurriculumPath(slug);
        if (cancelled) return;
        setPath(detail.path);

        if (accessToken) {
          const rows = await fetchCurriculumProgress();
          if (!cancelled) {
            setProgress(rows.find((row) => row.pathId === detail.path.id) ?? null);
          }
        } else {
          setProgress(null);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Yo‘l topilmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, accessToken]);

  const completed = useMemo(
    () => new Set(progress?.completedLessonIds ?? []),
    [progress],
  );

  const lessons = useMemo(() => (path ? flattenPathLessons(path) : []), [path]);
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const percent = pathProgressPercent(lessons.length, completedCount);
  const today = useMemo(
    () => (path ? pickTodayLessons(path, completed) : null),
    [path, completed],
  );
  const nextLesson = today?.lessons[0] ?? null;

  async function markComplete(lessonId: string) {
    if (!path) return;
    if (!accessToken) {
      navigate('/login', { state: { from: `/curriculum/${slug}` } });
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
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (error && !path) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--nur-danger)]">{error}</p>
        <Button to="/curriculum" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  if (!path) return null;

  const example = isExampleLabel(path.title);
  const modules = path.modules.slice().sort((a, b) => a.order - b.order);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link to="/curriculum" className="text-sm text-nur-muted">
        ← O‘quv yo‘llari
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-medium leading-snug">{displayTitle(path.title)}</h1>
          {example ? (
            <span className="rounded-[var(--radius-s)] border border-nur-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-nur-faint">
              EXAMPLE
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-nur-muted">
          {path.authors.map(displayTitle).join(', ')}
        </p>
        <p className="mt-4 text-sm leading-7 text-nur-muted">{displayTitle(path.summary)}</p>
        <p className="mt-3 text-xs text-nur-faint">
          {today ? `Kun ${today.dayIndex}/${today.dayTotal}` : null}
          {today ? ` · ${percent}%` : `${percent}%`} · {completedCount}/{lessons.length} dars
        </p>
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-nur-sunken"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-nur-lamp" style={{ width: `${percent}%` }} />
        </div>
      </header>

      {error ? <p className="mt-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}

      {nextLesson ? (
        <div className="mt-6 border-y border-nur-line py-4">
          <p className="text-xs uppercase tracking-wide text-nur-faint">Hozir</p>
          <p className="mt-1 text-xs text-nur-faint">
            {LESSON_SLOT_LABEL[nextLesson.targetType] ?? LESSON_KIND_LABEL[nextLesson.targetType]}
          </p>
          <p className="mt-1 text-sm font-medium">{displayTitle(nextLesson.title)}</p>
          {nextLesson.targetHref ? (
            <Button to={nextLesson.targetHref} className="mt-3">
              Davom etish
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-nur-muted">Barcha kunlar yakunlangan.</p>
      )}

      <div className="mt-10 space-y-10">
        {modules.map((module, index) => {
          const dayNum = index + 1;
          const theme = dayThemeFromModuleTitle(module.title);
          const moduleLessons = module.lessons.slice().sort((a, b) => a.order - b.order);
          const moduleDone = moduleLessons.every((lesson) => completed.has(lesson.id));
          const isCurrent = today?.dayIndex === dayNum && !moduleDone;

          return (
            <div key={module.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium text-nur-ink">
                  Kun {dayNum}
                  {theme ? ` · ${theme}` : ''}
                </h2>
                <span className="text-xs text-nur-faint">
                  {moduleDone ? 'Tugadi' : isCurrent ? 'Bugun' : ''}
                </span>
              </div>
              <ol className="mt-4 space-y-0 divide-y divide-nur-line border-y border-nur-line">
                {moduleLessons.map((lesson) => {
                  const done = completed.has(lesson.id);
                  const slot =
                    LESSON_SLOT_LABEL[lesson.targetType] ??
                    LESSON_KIND_LABEL[lesson.targetType] ??
                    lesson.targetType;
                  return (
                    <li key={lesson.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-nur-faint">{slot}</p>
                          <p className="mt-0.5 text-sm font-medium">
                            {displayTitle(lesson.title)}
                            {done ? (
                              <span className="ml-2 text-xs font-normal text-nur-lamp">✓</span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-xs text-nur-faint">
                            {LESSON_KIND_LABEL[lesson.targetType] ?? lesson.targetType}
                            {lesson.targetLabel
                              ? ` · ${displayTitle(lesson.targetLabel)}`
                              : ''}
                            {lesson.estimatedMinutes
                              ? ` · ~${lesson.estimatedMinutes} daq`
                              : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lesson.targetHref ? (
                            <Button to={lesson.targetHref} variant="secondary">
                              Ochish
                            </Button>
                          ) : null}
                          {!done ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => void markComplete(lesson.id)}
                            >
                              Yakunlash
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
