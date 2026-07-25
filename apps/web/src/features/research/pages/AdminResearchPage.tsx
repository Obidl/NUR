import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreateResearch,
  adminDeleteResearch,
  adminListResearch,
  adminPublishResearch,
  adminUpdateResearch,
} from '@/features/research/api/researchApi';
import { adminSetResearchStatus } from '@/features/admin/api/adminApi';
import type { AdminResearchArticle, ContentSource } from '@/features/research/types/research.types';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

const emptySource: ContentSource = {
  title: '',
  type: 'book',
  citation: '',
  url: null,
  notes: null,
};

type LicenseStatus =
  | 'owned'
  | 'licensed'
  | 'permission_granted'
  | 'public_domain'
  | 'unknown';

const initialForm = {
  title: '',
  summary: '',
  body: '',
  category: '',
  authors: '',
  reviewer: '',
  language: 'uz',
  licenseStatus: 'owned' as LicenseStatus,
  licenseNotes: '',
  source: { ...emptySource },
};

export function AdminResearchPage() {
  const [items, setItems] = useState<AdminResearchArticle[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const result = await adminListResearch();
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

  function startEdit(article: AdminResearchArticle) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      summary: article.summary,
      body: article.body,
      category: article.category,
      authors: article.authors.join(', '),
      reviewer: article.reviewer ?? '',
      language: article.language,
      licenseStatus: (article.rights.licenseStatus as LicenseStatus) || 'owned',
      licenseNotes: article.rights.licenseNotes ?? '',
      source: article.sources[0]
        ? {
            title: article.sources[0].title,
            type: article.sources[0].type,
            citation: article.sources[0].citation,
            url: article.sources[0].url,
            notes: article.sources[0].notes,
          }
        : { ...emptySource },
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const authors = form.authors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    const sources: ContentSource[] =
      form.source.title.trim() && form.source.citation.trim()
        ? [
            {
              title: form.source.title.trim(),
              type: form.source.type,
              citation: form.source.citation.trim(),
              url: form.source.url?.trim() || null,
              notes: form.source.notes?.trim() || null,
            },
          ]
        : [];

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      body: form.body.trim(),
      bodyFormat: 'html' as const,
      category: form.category.trim(),
      authors,
      reviewer: form.reviewer.trim() || null,
      language: form.language,
      sources,
      rights: {
        licenseStatus: form.licenseStatus,
        licenseNotes: form.licenseNotes.trim() || null,
      },
    };

    try {
      if (editingId) {
        await adminUpdateResearch(editingId, payload);
        setMessage('Maqola yangilandi');
      } else {
        await adminCreateResearch(payload);
        setMessage('Draft yaratildi');
        resetForm();
      }
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, 'Saqlash muvaffaqiyatsiz'));
    } finally {
      setSaving(false);
    }
  }

  async function onPublish(id: string) {
    setError(null);
    setMessage(null);
    try {
      await adminPublishResearch(id);
      setMessage('Nashr qilindi');
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, 'Nashr qilinmadi — manba/huquq tekshiring'));
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Maqolani arxivlashni tasdiqlaysizmi?')) return;
    try {
      await adminDeleteResearch(id);
      if (editingId === id) resetForm();
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, 'O‘chirish muvaffaqiyatsiz'));
    }
  }

  return (
    <section className="space-y-10">
      <header>
        <h1 className="text-xl font-medium">Tadqiqot CMS</h1>
        <p className="mt-1 text-sm text-nur-muted">
          Nashr uchun kamida bitta manba, muallif va aniq licenseStatus talab qilinadi.
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-nur-accent">{message}</p> : null}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 border-b border-nur-line pb-10">
        <h2 className="text-sm font-medium text-nur-muted">
          {editingId ? 'Tahrirlash' : 'Yangi draft'}
        </h2>

        <input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Sarlavha"
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <textarea
          required
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          placeholder="Qisqa xulosa"
          rows={2}
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <textarea
          required
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="Matn (HTML)"
          rows={8}
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 font-mono text-sm"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            required
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Kategoriya"
            className="rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          />
          <input
            required
            value={form.authors}
            onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))}
            placeholder="Mualliflar (vergul bilan)"
            className="rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          />
          <input
            value={form.reviewer}
            onChange={(e) => setForm((f) => ({ ...f, reviewer: e.target.value }))}
            placeholder="Tekshiruvchi (ixtiyoriy)"
            className="rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          />
          <select
            value={form.licenseStatus}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                licenseStatus: e.target.value as LicenseStatus,
              }))
            }
            className="rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          >
            <option value="owned">owned</option>
            <option value="licensed">licensed</option>
            <option value="permission_granted">permission_granted</option>
            <option value="public_domain">public_domain</option>
            <option value="unknown">unknown (draft only)</option>
          </select>
        </div>

        <fieldset className="space-y-2 rounded-[var(--radius-m)] border border-nur-line p-4">
          <legend className="px-1 text-xs text-nur-muted">Manba (nashr uchun majburiy)</legend>
          <input
            value={form.source.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, source: { ...f.source, title: e.target.value } }))
            }
            placeholder="Manba sarlavhasi"
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          />
          <select
            value={form.source.type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                source: {
                  ...f.source,
                  type: e.target.value as ContentSource['type'],
                },
              }))
            }
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          >
            <option value="book">book</option>
            <option value="article">article</option>
            <option value="scholar">scholar</option>
            <option value="quran">quran</option>
            <option value="hadith_collection">hadith_collection</option>
            <option value="other">other</option>
          </select>
          <textarea
            value={form.source.citation}
            onChange={(e) =>
              setForm((f) => ({ ...f, source: { ...f.source, citation: e.target.value } }))
            }
            placeholder="Iqtibos / citation"
            rows={2}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
          />
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saqlanmoqda…' : editingId ? 'Yangilash' : 'Draft yaratish'}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Bekor
            </Button>
          ) : null}
        </div>
      </form>

      <div>
        <h2 className="mb-4 text-sm font-medium text-nur-muted">Maqolalar</h2>
        {loading ? <p className="text-sm text-nur-muted">Yuklanmoqda…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-nur-muted">Hali maqola yo‘q.</p>
        ) : null}
        <ul className="divide-y divide-nur-line">
          {items.map((item) => (
            <li key={item.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-nur-faint">
                    manbalar: {item.sources.length} · {item.slug}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => startEdit(item)}>
                  Tahrir
                </Button>
              </div>
              <ContentWorkflowActions
                status={item.status}
                busy={saving}
                onStatus={(status) => {
                  setSaving(true);
                  setError(null);
                  void adminSetResearchStatus(item.id, status)
                    .then(async () => {
                      setMessage('Status yangilandi');
                      await reload();
                    })
                    .catch((err) => setError(getErrorMessage(err, 'Status yangilanmadi')))
                    .finally(() => setSaving(false));
                }}
                onPublish={() => void onPublish(item.id)}
                onSoftDelete={() => void onDelete(item.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
