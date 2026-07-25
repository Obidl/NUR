export type LessonTargetType =
  | 'quran_range'
  | 'podcast_episode'
  | 'video_episode'
  | 'book_chapter'
  | 'research_article';

export type PathCard = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  authors: string[];
  language: string;
  coverUrl: string | null;
  publishedAt: string | null;
  moduleCount: number;
  lessonCount: number;
};

export type PathLesson = {
  id: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
  targetType: LessonTargetType;
  targetRef: Record<string, unknown>;
  targetLabel: string | null;
  targetSlug: string | null;
  targetHref: string | null;
};

export type PathModule = {
  id: string;
  title: string;
  order: number;
  summary: string | null;
  lessons: PathLesson[];
};

export type PathDetail = PathCard & {
  modules: PathModule[];
};

export type PathProgressItem = {
  pathId: string;
  path: PathCard | null;
  currentLessonId: string | null;
  completedLessonIds: string[];
  updatedAt: string;
};

export type AdminPathLesson = {
  id?: string;
  title: string;
  order: number;
  estimatedMinutes?: number | null;
  targetType: LessonTargetType;
  targetRef: Record<string, unknown>;
};

export type AdminPathModule = {
  id?: string;
  title: string;
  order: number;
  summary?: string | null;
  lessons: AdminPathLesson[];
};

export type AdminLearningPath = PathCard & {
  status: string;
  rights: { licenseStatus: string; licenseNotes: string | null };
  modules: AdminPathModule[];
  updatedAt: string;
};
