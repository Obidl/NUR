import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreatePath,
  adminDeletePath,
  adminListPaths,
  adminPublishPath,
  adminUpdatePath,
} from '@/features/curriculum/api/curriculumApi';
import { adminSetCurriculumStatus } from '@/features/admin/api/adminApi';
import type { AdminLearningPath, LessonTargetType } from '@/features/curriculum/types/curriculum.types';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

type LicenseStatus =
  | 'owned'
  | 'licensed'
  | 'permission_granted'
  | 'public_domain'
  | 'unknown';

const initialForm = {
  title: '',
  summary: '',
  authors: '',
  language: 'uz',
  licenseStatus: 'owned' as LicenseStatus,
  licenseNotes: '',
  moduleTitle: '1-modul',
  lessonTitle: '',
  targetType: 'research_article' as LessonTargetType,
  articleId: '',
  surahNumber: '1',
  ayahFrom: '1',
  ayahTo: '7',
  episodeId: '',
  bookId: '',
  chapterId: '',
};

function buildTargetRef(form: typeof initialForm): Record<string, unknown> {
  switch (form.targetType) {
    case 'quran_range':
      return {
        surahNumber: Number(form.surahNumber),
        ayahFrom: Number(form.ayahFrom),
        ayahTo: Number(form.ayahTo),
      };
    case 'podcast_episode':
      return { episodeId: form.episodeId.trim() };
    case 'book_chapter':
      return { bookId: form.bookId.trim(), chapterId: form.chapterId.trim() };
    case 'research_article':
      return { articleId: form.articleId.trim() };
  }
}

export function AdminCurriculumPage() {
  const [items, setItems] = useState<AdminLearningPath[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const result = await adminListPaths();
    setItems(result.items);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Ro‘yxat yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit(path: AdminLearningPath) {
    const module = path.modules[0];
    const lesson = module?.lessons[0];
    setEditingId(path.id);
    setForm({
      title: path.title,
      summary: path.summary,
      authors: path.authors.join(', '),
      language: path.language,
      licenseStatus: (path.rights.licenseStatus as LicenseStatus) || 'owned',
      licenseNotes: path.rights.licenseNotes ?? '',
      moduleTitle: module?.title ?? '1-modul',
      lessonTitle: lesson?.title ?? '',
      targetType: lesson?.targetType ?? 'research_article',
      articleId: String(lesson?.targetRef?.articleId ?? ''),
      surahNumber: String(lesson?.targetRef?.surahNumber ?? '1'),
      ayahFrom: String(lesson?.targetRef?.ayahFrom ?? '1'),
      ayahTo: String(lesson?.targetRef?.ayahTo ?? '7'),
      episodeId: String(lesson?.targetRef?.episodeId ?? ''),
      bookId: String(lesson?.targetRef?.bookId ?? ''),
      chapterId: String(lesson?.targetRef?.chapterId ?? ''),
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        authors: form.authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        language: form.language,
        rights: {
          licenseStatus: form.licenseStatus,
          licenseNotes: form.licenseNotes.trim() || null,
        },
        modules: [
          {
            title: form.moduleTitle.trim() || '1-modul',
            order: 1,
            summary: null,
            lessons: [
              {
                title: form.lessonTitle.trim(),
                order: 1,
                estimatedMinutes: null,
                targetType: form.targetType,
                targetRef: buildTargetRef(form),
              },
            ],
          },
        ],
      };

      if (editingId) {
        await adminUpdatePath(editingId, payload);
        setMessage('Yo‘l yangilandi');
      } else {
        await adminCreatePath(payload);
        setMessage('Draft yaratildi');
        setForm(initialForm);
      }
      setEditingId(null);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-xl font-medium">O‘quv yo‘llari</h1>
        <p className="mt-1 text-sm text-nur-muted">
          Darslar faqat mavjud published kontentga bog‘lanadi (CU-01).
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-nur-lamp">{message}</p> : null}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 border-y border-nur-line py-6">
        <h2 className="text-sm font-medium">{editingId ? 'Tahrirlash' : 'Yangi yo‘l'}</h2>
        <input
          required
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          placeholder="Sarlavha"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          required
          rows={3}
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          placeholder="Qisqa tavsif (kamida 10 belgi)"
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
        />
        <input
          required
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          placeholder="Mualliflar (vergul bilan)"
          value={form.authors}
          onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))}
        />
        <input
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          placeholder="Modul nomi"
          value={form.moduleTitle}
          onChange={(e) => setForm((f) => ({ ...f, moduleTitle: e.target.value }))}
        />
        <input
          required
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          placeholder="Dars sarlavhasi"
          value={form.lessonTitle}
          onChange={(e) => setForm((f) => ({ ...f, lessonTitle: e.target.value }))}
        />
        <select
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          value={form.targetType}
          onChange={(e) =>
            setForm((f) => ({ ...f, targetType: e.target.value as LessonTargetType }))
          }
        >
          <option value="research_article">Tadqiqot maqolasi</option>
          <option value="quran_range">Qur’on oralig‘i</option>
          <option value="podcast_episode">Podcast epizod</option>
          <option value="book_chapter">Kitob bob</option>
        </select>

        {form.targetType === 'research_article' ? (
          <input
            required
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
            placeholder="articleId"
            value={form.articleId}
            onChange={(e) => setForm((f) => ({ ...f, articleId: e.target.value }))}
          />
        ) : null}
        {form.targetType === 'quran_range' ? (
          <div className="grid grid-cols-3 gap-2">
            <input
              className="rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
              placeholder="Surah #"
              value={form.surahNumber}
              onChange={(e) => setForm((f) => ({ ...f, surahNumber: e.target.value }))}
            />
            <input
              className="rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
              placeholder="Ayah from"
              value={form.ayahFrom}
              onChange={(e) => setForm((f) => ({ ...f, ayahFrom: e.target.value }))}
            />
            <input
              className="rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
              placeholder="Ayah to"
              value={form.ayahTo}
              onChange={(e) => setForm((f) => ({ ...f, ayahTo: e.target.value }))}
            />
          </div>
        ) : null}
        {form.targetType === 'podcast_episode' ? (
          <input
            required
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
            placeholder="episodeId"
            value={form.episodeId}
            onChange={(e) => setForm((f) => ({ ...f, episodeId: e.target.value }))}
          />
        ) : null}
        {form.targetType === 'book_chapter' ? (
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              className="rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
              placeholder="bookId"
              value={form.bookId}
              onChange={(e) => setForm((f) => ({ ...f, bookId: e.target.value }))}
            />
            <input
              required
              className="rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
              placeholder="chapterId"
              value={form.chapterId}
              onChange={(e) => setForm((f) => ({ ...f, chapterId: e.target.value }))}
            />
          </div>
        ) : null}

        <select
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-transparent px-3 py-2 text-sm"
          value={form.licenseStatus}
          onChange={(e) =>
            setForm((f) => ({ ...f, licenseStatus: e.target.value as LicenseStatus }))
          }
        >
          <option value="owned">owned</option>
          <option value="licensed">licensed</option>
          <option value="permission_granted">permission_granted</option>
          <option value="public_domain">public_domain</option>
          <option value="unknown">unknown</option>
        </select>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {editingId ? 'Saqlash' : 'Draft yaratish'}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
            >
              Bekor
            </Button>
          ) : null}
        </div>
      </form>

      {loading ? <p className="text-sm text-nur-muted">Yuklanmoqda…</p> : null}

      <ul className="divide-y divide-nur-line">
        {items.map((path) => (
          <li key={path.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{path.title}</p>
                <p className="mt-1 text-xs text-nur-faint">
                  {path.slug} · {path.lessonCount} dars
                </p>
                <div className="mt-2">
                  <StatusBadge status={path.status} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button type="button" variant="secondary" onClick={() => startEdit(path)}>
                  Tahrir
                </Button>
                <ContentWorkflowActions
                  status={path.status}
                  onPublish={async () => {
                    try {
                      await adminPublishPath(path.id);
                      setMessage('Nashr qilindi');
                      await reload();
                    } catch (err) {
                      setError(getErrorMessage(err));
                    }
                  }}
                  onStatus={async (status) => {
                    try {
                      await adminSetCurriculumStatus(path.id, status);
                      await reload();
                    } catch (err) {
                      setError(getErrorMessage(err));
                    }
                  }}
                  onSoftDelete={async () => {
                    try {
                      await adminDeletePath(path.id);
                      await reload();
                    } catch (err) {
                      setError(getErrorMessage(err));
                    }
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
