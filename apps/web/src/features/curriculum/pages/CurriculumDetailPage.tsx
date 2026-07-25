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

const TARGET_LABEL: Record<string, string> = {
  quran_range: 'Qur’on',
  podcast_episode: 'Podcast',
  book_chapter: 'Kitob',
  research_article: 'Tadqiqot',
};

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

  const nextLesson = useMemo(() => {
    if (!path) return null;
    const lessons = path.modules.flatMap((module) => module.lessons);
    return lessons.find((lesson) => !completed.has(lesson.id)) ?? null;
  }, [path, completed]);

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
      setProgress(updated);
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

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link to="/curriculum" className="text-sm text-nur-muted">
        ← O‘quv yo‘llari
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-medium leading-snug">{path.title}</h1>
        <p className="mt-2 text-sm text-nur-muted">{path.authors.join(', ')}</p>
        <p className="mt-4 text-sm leading-7 text-nur-muted">{path.summary}</p>
      </header>

      {error ? <p className="mt-4 text-sm text-[var(--nur-danger)]">{error}</p> : null}

      {nextLesson ? (
        <div className="mt-6 rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-nur-faint">Davom etish</p>
          <p className="mt-1 text-sm font-medium">{nextLesson.title}</p>
          {nextLesson.targetHref ? (
            <Button to={nextLesson.targetHref} className="mt-3">
              Darsga o‘tish
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-nur-muted">Barcha darslar yakunlangan (yoki hali boshlanmagan).</p>
      )}

      <div className="mt-10 space-y-8">
        {path.modules.map((module) => (
          <div key={module.id}>
            <h2 className="text-sm font-medium">{module.title}</h2>
            {module.summary ? (
              <p className="mt-1 text-xs text-nur-faint">{module.summary}</p>
            ) : null}
            <ol className="mt-4 space-y-3">
              {module.lessons.map((lesson) => {
                const done = completed.has(lesson.id);
                return (
                  <li
                    key={lesson.id}
                    className="border-b border-nur-line pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {lesson.order}. {lesson.title}
                          {done ? (
                            <span className="ml-2 text-xs font-normal text-nur-lamp">✓</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-nur-faint">
                          {TARGET_LABEL[lesson.targetType] ?? lesson.targetType}
                          {lesson.targetLabel ? ` · ${lesson.targetLabel}` : ''}
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
        ))}
      </div>
    </section>
  );
}
