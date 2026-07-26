import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  completeCurriculumLesson,
  fetchCurriculumPath,
  fetchCurriculumProgress,
} from '@/features/curriculum/api/curriculumApi';
import type { PathDetail, PathProgressItem } from '@/features/curriculum/types/curriculum.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';
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
  const { toast } = useToast();

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
      toast('Dars yakunlandi', 'success');
    } catch (err) {
      setError(getErrorMessage(err, 'Progress saqlanmadi'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <DetailLoading />;

  if (error && !path) {
    return (
      <section className="nur-page">
        <ErrorState message={error} />
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
    <section className="nur-page nur-fade-in">
      <DetailBackLink to="/curriculum">O‘quv yo‘llari</DetailBackLink>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="nur-page-title !text-[1.5rem] leading-snug md:!text-[1.75rem]">
            {displayTitle(path.title)}
          </h1>
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
        <p className="mt-4 text-xs text-nur-faint">
          {today ? `Kun ${today.dayIndex}/${today.dayTotal}` : null}
          {today ? ` · ${percent}%` : `${percent}%`} · {completedCount}/{lessons.length} dars
        </p>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-nur-sunken"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-nur-lamp transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      {error ? (
        <p className="mt-4 text-sm text-[var(--nur-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {nextLesson ? (
        <div className="nur-surface mt-8 px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-nur-faint">Hozir</p>
          <p className="mt-1 text-xs text-nur-faint">
            {LESSON_SLOT_LABEL[nextLesson.targetType] ?? LESSON_KIND_LABEL[nextLesson.targetType]}
          </p>
          <p className="mt-2 text-sm font-semibold tracking-[-0.01em]">
            {displayTitle(nextLesson.title)}
          </p>
          {nextLesson.targetHref ? (
            <Button to={nextLesson.targetHref} className="mt-4">
              Davom etish
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-nur-muted">Barcha kunlar yakunlangan.</p>
      )}

      <div className="mt-12">
        <ol className="relative space-y-0 ps-2">
          {modules.map((module, index) => {
            const dayNum = index + 1;
            const theme = dayThemeFromModuleTitle(module.title);
            const moduleLessons = module.lessons.slice().sort((a, b) => a.order - b.order);
            const moduleDone = moduleLessons.every((lesson) => completed.has(lesson.id));
            const isCurrent = today?.dayIndex === dayNum && !moduleDone;
            const isLast = index === modules.length - 1;

            return (
              <li key={module.id} className="relative flex gap-4 pb-10 last:pb-0">
                {!isLast ? (
                  <span
                    className="absolute start-[0.95rem] top-8 bottom-0 w-px bg-nur-line"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-[1] shrink-0 pt-0.5">
                  <span
                    className={cx(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2',
                      moduleDone && 'bg-nur-lamp text-nur-lamp-ink ring-nur-lamp',
                      isCurrent &&
                        'nur-breath bg-white text-nur-accent ring-nur-accent',
                      !moduleDone &&
                        !isCurrent &&
                        'bg-transparent text-nur-muted ring-nur-line opacity-60',
                    )}
                    aria-hidden
                  >
                    {moduleDone ? '✓' : dayNum}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-base font-medium tracking-[-0.015em] text-nur-ink">
                      Kun {dayNum}
                      {theme ? ` — ${theme}` : ''}
                    </h2>
                    <span
                      className={cx(
                        'text-xs font-medium',
                        moduleDone ? 'text-nur-accent' : isCurrent ? 'text-nur-accent' : 'text-nur-muted',
                      )}
                    >
                      {moduleDone ? 'Tugadi' : isCurrent ? 'Bugun' : ''}
                    </span>
                  </div>
                  <ol className="nur-list">
                    {moduleLessons.map((lesson) => {
                      const done = completed.has(lesson.id);
                      const slot =
                        LESSON_SLOT_LABEL[lesson.targetType] ??
                        LESSON_KIND_LABEL[lesson.targetType] ??
                        lesson.targetType;
                      return (
                        <li key={lesson.id}>
                          <div className="nur-list-row !items-start justify-between">
                            <div className="min-w-0">
                              <p className="nur-section-label !text-[9px]">{slot}</p>
                              <p className="mt-1 text-sm font-semibold tracking-[-0.01em]">
                                {displayTitle(lesson.title)}
                                {done ? (
                                  <span className="ml-2 text-xs font-normal text-nur-accent">✓</span>
                                ) : null}
                              </p>
                              <p className="mt-1 text-xs text-nur-muted">
                                {LESSON_KIND_LABEL[lesson.targetType] ?? lesson.targetType}
                                {lesson.targetLabel
                                  ? ` · ${displayTitle(lesson.targetLabel)}`
                                  : ''}
                                {lesson.estimatedMinutes
                                  ? ` · ~${lesson.estimatedMinutes} daq`
                                  : ''}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
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
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
