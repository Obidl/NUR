import type {
  PathDetail,
  PathLesson,
  PathProgressItem,
} from '@/features/curriculum/types/curriculum.types';

export const LESSON_KIND_LABEL: Record<string, string> = {
  quran_range: 'Qur’on',
  podcast_episode: 'Podcast',
  book_chapter: 'Kitob',
  research_article: 'Tadqiqot',
};

/** Kun bo‘yi tartib — hamma tushunadigan slot. */
export const LESSON_SLOT_LABEL: Record<string, string> = {
  quran_range: 'Ertalab',
  podcast_episode: 'Yo‘lda',
  book_chapter: 'Kechqurun',
  research_article: 'Qo‘shimcha',
};

const EXAMPLE_PREFIX = /^EXAMPLE\s*[—–-]\s*/i;

export function isExampleLabel(text: string): boolean {
  return EXAMPLE_PREFIX.test(text.trim()) || text.includes('NOT FOR PRODUCTION');
}

/** UI uchun toza sarlavha; ma’lumot bazasida EXAMPLE qoladi. */
export function displayTitle(text: string): string {
  return text.replace(EXAMPLE_PREFIX, '').trim();
}

export function dayThemeFromModuleTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  if (title.includes('·')) {
    return displayTitle(title.split('·').slice(1).join('·').trim());
  }
  return displayTitle(title);
}

export function flattenPathLessons(path: PathDetail): PathLesson[] {
  return path.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => module.lessons.slice().sort((a, b) => a.order - b.order));
}

/**
 * Joriy kun moduli: birinchi to‘liq tugallanmagan modulning ochiq darslari.
 */
export function pickTodayLessons(
  path: PathDetail,
  completedIds: Iterable<string>,
): { lessons: PathLesson[]; dayIndex: number; dayTotal: number; moduleTitle: string | null } {
  const done = new Set(completedIds);
  const modules = path.modules.slice().sort((a, b) => a.order - b.order);
  const dayTotal = modules.length || 1;

  for (let i = 0; i < modules.length; i += 1) {
    const module = modules[i]!;
    const sorted = module.lessons.slice().sort((a, b) => a.order - b.order);
    const incomplete = sorted.filter((lesson) => !done.has(lesson.id));
    if (incomplete.length > 0) {
      return {
        lessons: incomplete,
        dayIndex: i + 1,
        dayTotal,
        moduleTitle: module.title,
      };
    }
  }

  return {
    lessons: [],
    dayIndex: dayTotal,
    dayTotal,
    moduleTitle: modules[modules.length - 1]?.title ?? null,
  };
}

export function pathProgressPercent(total: number, completedCount: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completedCount / total) * 100));
}

export function formatHomeDates(now = new Date()): { gregorian: string; hijri: string | null } {
  const gregorian = new Intl.DateTimeFormat('uz-UZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  let hijri: string | null = null;
  try {
    hijri = new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  } catch {
    hijri = null;
  }

  return { gregorian, hijri };
}

export function mergeProgressUpdate(
  previous: PathProgressItem | null,
  update: {
    pathId: string;
    currentLessonId: string | null;
    completedLessonIds: string[];
    updatedAt: string;
  },
  path: PathDetail,
): PathProgressItem {
  return {
    pathId: update.pathId,
    path: previous?.path ?? {
      id: path.id,
      title: path.title,
      slug: path.slug,
      summary: path.summary,
      authors: path.authors,
      language: path.language,
      coverUrl: path.coverUrl,
      publishedAt: path.publishedAt,
      moduleCount: path.moduleCount,
      lessonCount: path.lessonCount,
    },
    currentLessonId: update.currentLessonId,
    completedLessonIds: update.completedLessonIds,
    updatedAt: update.updatedAt,
  };
}
