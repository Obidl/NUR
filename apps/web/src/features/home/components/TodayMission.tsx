import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Check, Circle, Mic2, Play, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import type { PathLesson } from '@/features/curriculum/types/curriculum.types';
import { fetchSurah } from '@/features/quran/api/quranApi';
import {
  LESSON_KIND_LABEL,
  LESSON_SLOT_LABEL,
  dayProgressPercent,
  displayTitle,
  estimateMinutes,
} from '@/features/home/lib/todayPath';
import { cx } from '@/shared/lib/cx';

type TodayMissionProps = {
  greetingName?: string | null;
  dates: { gregorian: string; hijri: string | null };
  dayIndex: number;
  dayTotal: number;
  dayLabel: string | null;
  pathSlug: string;
  lessons: PathLesson[];
  completedIds: Set<string>;
  saving: boolean;
  requireLogin?: boolean;
  onComplete: (lessonId: string) => void;
};

function ProgressRing({ percent }: { percent: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative mx-auto h-24 w-24">
      <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--nur-line)"
          strokeWidth="6"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--nur-lamp)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-medium tabular-nums text-nur-ink">{percent}%</span>
        <span className="text-[10px] uppercase tracking-wide text-nur-faint">yakun</span>
      </div>
    </div>
  );
}

function lessonIcon(type: string) {
  if (type === 'podcast_episode') return Mic2;
  return BookOpen;
}

export function TodayMission({
  greetingName,
  dates,
  dayIndex,
  dayTotal,
  dayLabel,
  pathSlug,
  lessons,
  completedIds,
  saving,
  requireLogin,
  onComplete,
}: TodayMissionProps) {
  const percent = dayProgressPercent(lessons, completedIds);
  const minutes = estimateMinutes(lessons);
  const morning = lessons.find((l) => l.targetType === 'quran_range') ?? null;
  const commute = lessons.find((l) => l.targetType === 'podcast_episode') ?? null;
  const evening =
    lessons.find((l) => l.targetType === 'book_chapter') ??
    lessons.find((l) => l.targetType === 'research_article') ??
    null;

  const [previewArabic, setPreviewArabic] = useState<string | null>(null);
  const [previewUz, setPreviewUz] = useState<string | null>(null);
  const [previewSurah, setPreviewSurah] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAyah() {
      setPreviewArabic(null);
      setPreviewUz(null);
      setPreviewSurah(null);
      if (!morning) return;
      const surahNumber = Number(morning.targetRef.surahNumber);
      const ayahFrom = Number(morning.targetRef.ayahFrom ?? 1);
      if (!Number.isFinite(surahNumber)) return;
      try {
        const detail = await fetchSurah(surahNumber);
        if (cancelled) return;
        const ayah = detail.ayahs.find((a) => a.ayahNumber === ayahFrom) ?? detail.ayahs[0];
        setPreviewSurah(detail.surah.nameLatin || detail.surah.nameUz || `Surah ${surahNumber}`);
        setPreviewArabic(ayah?.textArabic ?? null);
        setPreviewUz(ayah?.textUz ?? null);
      } catch {
        if (!cancelled) {
          setPreviewArabic(null);
          setPreviewUz(null);
        }
      }
    }
    void loadAyah();
    return () => {
      cancelled = true;
    };
  }, [morning?.id, morning?.targetRef.surahNumber, morning?.targetRef.ayahFrom]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-10">
      <header className="relative pr-12">
        <Link
          to="/settings"
          className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-nur-line bg-nur-elevated text-nur-muted"
          aria-label="Sozlamalar"
        >
          <Settings size={18} strokeWidth={1.75} />
        </Link>
        <p className="text-xs text-nur-lamp">{dates.hijri ? `${dates.hijri}` : ''}</p>
        <p className="mt-0.5 text-sm text-nur-muted">{dates.gregorian}</p>
        <p className="mt-2 font-display text-sm tracking-[0.2em] text-nur-faint">NUR</p>
        <h1 className="mt-3 text-3xl font-medium text-nur-ink">
          Assalomu alaykum{greetingName ? `, ${greetingName}` : ''}
        </h1>
        <p className="mt-2 text-sm text-nur-muted">
          Bugungi yo‘l Bomdoddan keyin boshlanadi.
          {dayLabel ? ` Mavzu: ${dayLabel}.` : ''}
        </p>
      </header>

      {/* Today's Mission — video 1 composition */}
      <section
        aria-labelledby="mission-heading"
        className="rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated px-5 py-6"
      >
        <h2 id="mission-heading" className="text-center text-sm font-medium text-nur-muted">
          Bugungi vazifa
        </h2>
        <div className="mt-4">
          <ProgressRing percent={percent} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-nur-faint">
          <div>
            <p className="text-sm font-medium tabular-nums text-nur-ink">
              Kun {dayIndex}/{dayTotal}
            </p>
            <p>Yo‘l</p>
          </div>
          <div>
            <p className="text-sm font-medium tabular-nums text-nur-ink">~{minutes || '—'}m</p>
            <p>Bugun</p>
          </div>
          <div>
            <p className="text-sm font-medium tabular-nums text-nur-ink">
              {lessons.filter((l) => completedIds.has(l.id)).length}/{lessons.length}
            </p>
            <p>Qadam</p>
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {lessons.map((lesson) => {
            const done = completedIds.has(lesson.id);
            const Icon = lessonIcon(lesson.targetType);
            const slot =
              LESSON_SLOT_LABEL[lesson.targetType] ?? LESSON_KIND_LABEL[lesson.targetType];
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={done || saving || requireLogin}
                  onClick={() => onComplete(lesson.id)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/50 px-3 py-3 text-left transition-opacity',
                    done && 'opacity-70',
                    !done && !requireLogin && 'hover:bg-nur-sunken',
                    (saving || requireLogin) && !done && 'opacity-80',
                  )}
                  aria-label={
                    done
                      ? `${displayTitle(lesson.title)} yakunlangan`
                      : `${displayTitle(lesson.title)} ni yakunlash`
                  }
                >
                  <Icon
                    className="shrink-0 text-nur-lamp"
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-nur-faint">{slot}</p>
                    <p className="truncate text-sm font-medium text-nur-ink">
                      {displayTitle(lesson.title)}
                    </p>
                    <p className="truncate text-xs text-nur-faint">
                      {lesson.targetLabel
                        ? displayTitle(lesson.targetLabel)
                        : LESSON_KIND_LABEL[lesson.targetType]}
                      {lesson.estimatedMinutes ? ` · ~${lesson.estimatedMinutes} daq` : ''}
                    </p>
                  </div>
                  <span className="text-nur-lamp" aria-hidden>
                    {done ? <Check size={20} /> : <Circle size={20} strokeWidth={1.5} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {requireLogin ? (
          <p className="mt-3 text-center text-xs text-nur-faint">
            Belgilash uchun <Link to="/login" className="text-nur-accent">kirish</Link> kerak.
          </p>
        ) : null}
      </section>

      {/* Morning */}
      {morning ? (
        <RoutineBlock
          title="Ertalabgi tartib"
          done={completedIds.has(morning.id)}
          markLabel="Ertalabni yakunlash"
          saving={saving}
          requireLogin={requireLogin}
          onComplete={() => onComplete(morning.id)}
          openHref={morning.targetHref}
          openLabel="O‘qish / tinglash"
        >
          <p className="text-lg font-medium text-nur-ink">
            {previewSurah ?? displayTitle(morning.title)}
          </p>
          <p className="mt-1 text-xs text-nur-faint">
            {morning.targetLabel ? displayTitle(morning.targetLabel) : null}
            {morning.estimatedMinutes ? ` · ~${morning.estimatedMinutes} daq` : ''}
          </p>
          {previewArabic ? (
            <p
              dir="rtl"
              lang="ar"
              className="mt-5 text-center text-2xl leading-loose text-nur-ink"
              style={{ fontFamily: 'Scheherazade New, Amiri, serif' }}
            >
              {previewArabic}
            </p>
          ) : null}
          {previewUz ? (
            <p className="mt-3 text-center text-sm leading-6 text-nur-muted">{previewUz}</p>
          ) : null}
          <p className="mt-5 text-xs text-nur-faint">Tafakkur</p>
          <p className="mt-1 text-sm text-nur-muted">
            Bugun o‘qigan oyatdan qalbimga nima tegdi?
          </p>
        </RoutineBlock>
      ) : null}

      {/* Commute */}
      {commute ? (
        <RoutineBlock
          title="Yo‘lda"
          done={completedIds.has(commute.id)}
          markLabel="Podcastni yakunlash"
          saving={saving}
          requireLogin={requireLogin}
          onComplete={() => onComplete(commute.id)}
          openHref={commute.targetHref}
          openLabel="Davom ettirish"
          openIcon
        >
          <p className="text-xs uppercase tracking-wide text-nur-faint">Podcast</p>
          <p className="mt-1 text-lg font-medium text-nur-ink">{displayTitle(commute.title)}</p>
          <p className="mt-1 text-sm text-nur-muted">
            {commute.targetLabel ? displayTitle(commute.targetLabel) : 'Siyrat darsi'}
            {commute.estimatedMinutes ? ` · ~${commute.estimatedMinutes} daq` : ''}
          </p>
          <p className="mt-4 text-sm text-nur-faint">To‘xtagan joydan davom eting.</p>
        </RoutineBlock>
      ) : null}

      {/* Evening */}
      {evening ? (
        <RoutineBlock
          title="Kechqurun"
          done={completedIds.has(evening.id)}
          markLabel="Kechqurunni yakunlash"
          saving={saving}
          requireLogin={requireLogin}
          onComplete={() => onComplete(evening.id)}
          openHref={evening.targetHref}
          openLabel="Kitobni ochish"
        >
          <p className="text-xs uppercase tracking-wide text-nur-faint">Kitob</p>
          <p className="mt-1 text-lg font-medium text-nur-ink">{displayTitle(evening.title)}</p>
          <p className="mt-1 text-sm text-nur-muted">
            {evening.targetLabel ? displayTitle(evening.targetLabel) : null}
            {evening.estimatedMinutes ? ` · ~${evening.estimatedMinutes} daq` : ''}
          </p>
          <p className="mt-5 text-xs text-nur-faint">Refleksiya</p>
          <p className="mt-1 text-sm text-nur-muted">Ertaga qanday amal qilaman?</p>
        </RoutineBlock>
      ) : null}

      <p className="pb-8 text-center">
        <Link to={`/curriculum/${pathSlug}`} className="text-sm text-nur-muted">
          Butun 15 kunlik yo‘l →
        </Link>
      </p>
    </div>
  );
}

function RoutineBlock({
  title,
  children,
  done,
  markLabel,
  saving,
  requireLogin,
  onComplete,
  openHref,
  openLabel,
  openIcon,
}: {
  title: string;
  children: ReactNode;
  done: boolean;
  markLabel: string;
  saving: boolean;
  requireLogin?: boolean;
  onComplete: () => void;
  openHref: string | null;
  openLabel: string;
  openIcon?: boolean;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium text-nur-ink">{title}</h2>
      <div className="mt-4 rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated px-5 py-5">
        {children}
        <div className="mt-6 flex flex-col gap-2">
          {openHref ? (
            <Button to={openHref} variant="secondary" className="w-full gap-2">
              {openIcon ? <Play size={16} aria-hidden /> : null}
              {openLabel}
            </Button>
          ) : null}
          {!done ? (
            <Button
              type="button"
              className="w-full"
              disabled={saving || requireLogin}
              onClick={onComplete}
            >
              {requireLogin ? 'Kirish kerak' : markLabel}
            </Button>
          ) : (
            <p className="text-center text-sm text-nur-lamp">✓ Yakunlangan</p>
          )}
        </div>
      </div>
    </section>
  );
}
