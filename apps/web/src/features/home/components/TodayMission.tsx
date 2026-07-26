import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Check, Circle, Mic2, Play, Settings, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import type { PathLesson } from '@/features/curriculum/types/curriculum.types';
import { fetchSurah } from '@/features/quran/api/quranApi';
import { fetchPodcastEpisode } from '@/features/podcasts/api/podcastApi';
import { usePodcastPlayerStore } from '@/features/podcasts/store/podcastPlayerStore';
import {
  LESSON_KIND_LABEL,
  LESSON_SLOT_LABEL,
  dayProgressPercent,
  displayTitle,
  estimateMinutes,
} from '@/features/home/lib/todayPath';
import { cx } from '@/shared/lib/cx';
import { getErrorMessage } from '@/shared/lib/errors';

type TodayMissionProps = {
  greetingName?: string | null;
  dates: { gregorian: string; hijri: string | null };
  dayIndex: number;
  dayTotal: number;
  dayLabel: string | null;
  pathSlug: string;
  pathPercent: number;
  lessons: PathLesson[];
  completedIds: Set<string>;
  saving: boolean;
  requireLogin?: boolean;
  onComplete: (lessonId: string) => void;
};

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative mx-auto h-24 w-24">
      <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--nur-line)" strokeWidth="6" />
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
        <span className="text-[10px] uppercase tracking-wide text-nur-faint">{label}</span>
      </div>
    </div>
  );
}

function sectionIdForType(type: string): string {
  if (type === 'quran_range') return 'routine-morning';
  if (type === 'podcast_episode' || type === 'video_episode') return 'routine-commute';
  return 'routine-evening';
}

function lessonIcon(type: string) {
  if (type === 'podcast_episode') return Mic2;
  if (type === 'video_episode') return Video;
  return BookOpen;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function TodayMission({
  greetingName,
  dates,
  dayIndex,
  dayTotal,
  dayLabel,
  pathSlug,
  pathPercent,
  lessons,
  completedIds,
  saving,
  requireLogin,
  onComplete,
}: TodayMissionProps) {
  const percent = dayProgressPercent(lessons, completedIds);
  const minutes = estimateMinutes(lessons);
  const morning = lessons.find((l) => l.targetType === 'quran_range') ?? null;
  const commute =
    lessons.find((l) => l.targetType === 'video_episode') ??
    lessons.find((l) => l.targetType === 'podcast_episode') ??
    null;
  const evening =
    lessons.find((l) => l.targetType === 'book_chapter') ??
    lessons.find((l) => l.targetType === 'research_article') ??
    null;

  const loadEpisode = usePodcastPlayerStore((s) => s.loadEpisode);
  const [previewArabic, setPreviewArabic] = useState<string | null>(null);
  const [previewUz, setPreviewUz] = useState<string | null>(null);
  const [previewSurah, setPreviewSurah] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

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

  async function playCommute() {
    if (!commute) return;
    if (commute.targetType === 'video_episode') {
      if (commute.targetHref) window.location.assign(commute.targetHref);
      return;
    }
    const episodeId = String(commute.targetRef.episodeId ?? '');
    if (!episodeId) {
      if (commute.targetHref) window.location.assign(commute.targetHref);
      return;
    }
    setPlaying(true);
    setPlayError(null);
    try {
      const detail = await fetchPodcastEpisode(episodeId);
      loadEpisode({
        episodeId: detail.id,
        title: detail.title,
        seriesTitle: detail.series.title,
        hostOrScholar: detail.series.hostOrScholar,
        audioUrl: detail.audioUrl,
        durationSeconds: detail.durationSeconds,
        positionSeconds: 0,
      });
    } catch (err) {
      setPlayError(getErrorMessage(err, 'Audio ochilmadi'));
    } finally {
      setPlaying(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-12">
      <header className="relative pr-12">
        <Link
          to="/settings"
          className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-m)] text-nur-muted transition-colors hover:bg-nur-sunken hover:text-nur-ink"
          aria-label="Sozlamalar"
        >
          <Settings size={18} strokeWidth={1.75} />
        </Link>
        <p className="text-xs text-nur-lamp">{dates.hijri ? `${dates.hijri}` : ''}</p>
        <p className="mt-1 text-sm leading-relaxed text-nur-muted">{dates.gregorian}</p>
        <p className="mt-4 font-display text-sm tracking-[0.22em] text-nur-ink">NUR</p>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-[-0.02em] text-nur-ink md:text-[2rem]">
          Assalomu alaykum{greetingName ? `, ${greetingName}` : ''}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-nur-muted">
          Bugungi yo‘l Bomdoddan keyin boshlanadi.
          {dayLabel ? ` Mavzu: ${dayLabel}.` : ''}
        </p>
      </header>

      <section aria-labelledby="mission-heading" className="nur-surface px-5 py-7 md:px-6">
        <h2 id="mission-heading" className="nur-section-label text-center">
          Bugungi vazifa
        </h2>
        <div className="mt-5">
          <ProgressRing percent={percent} label="bugun" />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-nur-faint">
          <div>
            <p className="text-sm font-medium tabular-nums text-nur-ink">
              Kun {dayIndex}/{dayTotal}
            </p>
            <p className="mt-0.5">Yo‘l</p>
          </div>
          <div>
            <p className="text-sm font-medium tabular-nums text-nur-ink">~{minutes || '—'}m</p>
            <p className="mt-0.5">Bugun</p>
          </div>
          <div>
            <p className="text-sm font-medium tabular-nums text-nur-ink">
              {lessons.filter((l) => completedIds.has(l.id)).length}/{lessons.length}
            </p>
            <p className="mt-0.5">Qadam</p>
          </div>
        </div>

        <ul className="mt-7 space-y-1">
          {lessons.map((lesson) => {
            const done = completedIds.has(lesson.id);
            const Icon = lessonIcon(lesson.targetType);
            const slot =
              LESSON_SLOT_LABEL[lesson.targetType] ?? LESSON_KIND_LABEL[lesson.targetType];
            const targetSection = sectionIdForType(lesson.targetType);
            return (
              <li key={lesson.id}>
                <div
                  className={cx(
                    'flex w-full items-center gap-1 rounded-[var(--radius-m)] px-1 py-1.5',
                    done && 'opacity-65',
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-m)] px-2 py-2 text-left transition-colors hover:bg-nur-sunken/60"
                    onClick={() => scrollToSection(targetSection)}
                  >
                    <Icon
                      className="shrink-0 text-nur-lamp"
                      size={18}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-nur-faint">{slot}</p>
                      <p className="truncate text-sm font-medium tracking-[-0.01em] text-nur-ink">
                        {displayTitle(lesson.title)}
                      </p>
                      <p className="truncate text-xs leading-relaxed text-nur-faint">
                        {lesson.targetLabel
                          ? displayTitle(lesson.targetLabel)
                          : LESSON_KIND_LABEL[lesson.targetType]}
                        {lesson.estimatedMinutes ? ` · ~${lesson.estimatedMinutes} daq` : ''}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={done || saving || requireLogin}
                    onClick={() => onComplete(lesson.id)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-nur-lamp disabled:opacity-50"
                    aria-label={
                      done
                        ? `${displayTitle(lesson.title)} yakunlangan`
                        : `${displayTitle(lesson.title)} ni yakunlash`
                    }
                  >
                    {done ? <Check size={20} /> : <Circle size={20} strokeWidth={1.5} />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {requireLogin ? (
          <p className="mt-4 text-center text-xs leading-relaxed text-nur-faint">
            Belgilash uchun{' '}
            <Link to="/login" className="nur-link">
              kirish
            </Link>{' '}
            kerak.
          </p>
        ) : null}
      </section>

      {morning ? (
        <RoutineBlock
          id="routine-morning"
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
          <p className="mt-1 text-sm text-nur-muted">Bugun o‘qigan oyatdan qalbimga nima tegdi?</p>
        </RoutineBlock>
      ) : null}

      {commute ? (
        <RoutineBlock
          id="routine-commute"
          title="Yo‘lda"
          done={completedIds.has(commute.id)}
          markLabel={
            commute.targetType === 'video_episode' ? 'Videoni yakunlash' : 'Podcastni yakunlash'
          }
          saving={saving}
          requireLogin={requireLogin}
          onComplete={() => onComplete(commute.id)}
          onPrimaryAction={
            commute.targetType === 'video_episode' ? undefined : () => void playCommute()
          }
          primaryBusy={playing}
          openHref={commute.targetType === 'video_episode' ? commute.targetHref : undefined}
          openLabel={commute.targetType === 'video_episode' ? 'Videoni ochish' : 'Davom ettirish'}
          openIcon={commute.targetType !== 'video_episode'}
        >
          <p className="text-xs uppercase tracking-wide text-nur-faint">
            {commute.targetType === 'video_episode' ? 'Video' : 'Podcast'}
          </p>
          <p className="mt-1 text-lg font-medium text-nur-ink">{displayTitle(commute.title)}</p>
          <p className="mt-1 text-sm text-nur-muted">
            {commute.targetLabel ? displayTitle(commute.targetLabel) : 'Siyrat darsi'}
            {commute.estimatedMinutes ? ` · ~${commute.estimatedMinutes} daq` : ''}
          </p>
          <p className="mt-4 text-sm text-nur-faint">
            {commute.targetType === 'video_episode'
              ? 'YouTube embed — ilova ichida ko‘ring.'
              : 'To‘xtagan joydan davom eting.'}
          </p>
          {playError ? <p className="mt-2 text-xs text-[var(--nur-danger)]">{playError}</p> : null}
        </RoutineBlock>
      ) : null}

      {evening ? (
        <RoutineBlock
          id="routine-evening"
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

      <section id="routine-progress" className="pb-4">
        <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-nur-ink">Progress</h2>
        <div className="mt-5 nur-surface px-5 py-7">
          <ProgressRing percent={pathPercent} label="15 kun" />
          <p className="mt-5 text-center text-sm leading-relaxed text-nur-muted">
            Kun {dayIndex}/{dayTotal}
            {dayLabel ? ` · ${dayLabel}` : ''}
          </p>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-nur-faint">
              <span>Yo‘l bo‘yicha</span>
              <span>{pathPercent}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-nur-sunken">
              <div
                className="h-full rounded-full bg-nur-lamp"
                style={{ width: `${pathPercent}%` }}
              />
            </div>
          </div>
          <p className="mt-7 text-center">
            <Link to={`/curriculum/${pathSlug}`} className="nur-link text-sm">
              Butun yo‘lni ko‘rish →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function RoutineBlock({
  id,
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
  onPrimaryAction,
  primaryBusy,
}: {
  id: string;
  title: string;
  children: ReactNode;
  done: boolean;
  markLabel: string;
  saving: boolean;
  requireLogin?: boolean;
  onComplete: () => void;
  openHref?: string | null;
  openLabel: string;
  openIcon?: boolean;
  onPrimaryAction?: () => void;
  primaryBusy?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-nur-ink">{title}</h2>
      <div className="mt-5 nur-surface px-5 py-6">
        {children}
        <div className="mt-7 flex flex-col gap-2.5">
          {onPrimaryAction ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              disabled={primaryBusy}
              onClick={onPrimaryAction}
            >
              {openIcon ? <Play size={16} aria-hidden /> : null}
              {primaryBusy ? 'Ochilmoqda…' : openLabel}
            </Button>
          ) : openHref ? (
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
