import { Check, Circle } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import type { PathLesson } from '@/features/curriculum/types/curriculum.types';
import {
  LESSON_KIND_LABEL,
  LESSON_SLOT_LABEL,
  displayTitle,
  isExampleLabel,
} from '@/features/home/lib/todayPath';

type TodayJourneyProps = {
  pathTitle: string;
  pathSlug: string;
  percent: number;
  completedCount: number;
  totalCount: number;
  dayIndex: number;
  dayTotal: number;
  dayLabel: string | null;
  lessons: PathLesson[];
  completedIds: Set<string>;
  saving: boolean;
  onComplete: (lessonId: string) => void;
  requireLogin?: boolean;
};

export function TodayJourney({
  pathTitle,
  pathSlug,
  percent,
  completedCount,
  totalCount,
  dayIndex,
  dayTotal,
  dayLabel,
  lessons,
  completedIds,
  saving,
  onComplete,
  requireLogin,
}: TodayJourneyProps) {
  const allDone = totalCount > 0 && completedCount >= totalCount;
  const examplePath = isExampleLabel(pathTitle);

  return (
    <section aria-labelledby="bugungi-yol-heading" className="w-full max-w-xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="bugungi-yol-heading" className="text-lg font-medium text-nur-ink">
              Bugungi yo‘l
            </h2>
            {examplePath ? (
              <span className="rounded-[var(--radius-s)] border border-nur-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-nur-faint">
                EXAMPLE
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-nur-muted">{displayTitle(pathTitle)}</p>
          <p className="mt-1 text-xs text-nur-faint">
            Kun {dayIndex}/{dayTotal}
            {dayLabel ? ` · ${dayLabel}` : ''}
          </p>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-nur-faint">
          {percent}%
        </p>
      </div>

      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-nur-sunken"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Yo‘l progressi"
      >
        <div
          className="h-full rounded-full bg-nur-lamp transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {allDone ? (
        <p className="mt-6 text-sm text-nur-muted">
          Yo‘l tugadi. Ertaga yangi odat bilan davom eting.
        </p>
      ) : lessons.length === 0 ? (
        <p className="mt-6 text-sm text-nur-muted">Hali ochiq dars yo‘q.</p>
      ) : (
        <ul className="mt-6 divide-y divide-nur-line border-y border-nur-line">
          {lessons.map((lesson) => {
            const done = completedIds.has(lesson.id);
            const slot = LESSON_SLOT_LABEL[lesson.targetType] ?? '';
            const kind = LESSON_KIND_LABEL[lesson.targetType] ?? lesson.targetType;
            return (
              <li key={lesson.id} className="flex flex-wrap items-center gap-3 py-4">
                <span className="text-nur-lamp" aria-hidden>
                  {done ? (
                    <Check size={18} strokeWidth={2} />
                  ) : (
                    <Circle size={18} strokeWidth={1.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-nur-faint">
                    {slot || kind}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-nur-ink">
                    {displayTitle(lesson.title)}
                  </p>
                  <p className="mt-0.5 text-xs text-nur-faint">
                    {kind}
                    {lesson.targetLabel ? ` · ${displayTitle(lesson.targetLabel)}` : ''}
                    {lesson.estimatedMinutes ? ` · ~${lesson.estimatedMinutes} daq` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lesson.targetHref ? (
                    <Button to={lesson.targetHref} variant="secondary" className="min-h-10 px-4">
                      Ochish
                    </Button>
                  ) : null}
                  {!done ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-10 px-4"
                      disabled={saving || requireLogin}
                      onClick={() => onComplete(lesson.id)}
                    >
                      {requireLogin ? 'Kirish kerak' : 'Yakunlash'}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4">
        <Button
          to={`/curriculum/${pathSlug}`}
          variant="ghost"
          className="min-h-10 px-0 text-nur-muted"
        >
          Butun yo‘lni ko‘rish →
        </Button>
      </p>
    </section>
  );
}
