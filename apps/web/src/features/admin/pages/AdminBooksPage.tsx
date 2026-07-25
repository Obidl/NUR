import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreateBook,
  adminDeleteBook,
  adminListBooks,
  adminPublishBook,
  adminSetBookStatus,
  type AdminContentCard,
  type EditorialStatus,
} from '@/features/admin/api/adminApi';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

export function AdminBooksPage() {
  const [items, setItems] = useState<AdminContentCard[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload(status?: string) {
    const result = await adminListBooks({ status: status || undefined });
    setItems(result.items);
  }

  useEffect(() => {
    void reload(statusFilter).catch((err) =>
      setError(getErrorMessage(err, 'Ro‘yxat yuklanmadi')),
    );
  }, [statusFilter]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminCreateBook({
        title: title.trim(),
        authors: authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        description: description.trim(),
        coverUrl: coverUrl.trim(),
        rights: { licenseStatus: 'owned', licenseNotes: 'admin cms' },
      });
      setTitle('');
      setAuthors('');
      setDescription('');
      await reload(statusFilter);
    } catch (err) {
      setError(getErrorMessage(err, 'Yaratilmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload(statusFilter);
    } catch (err) {
      setError(getErrorMessage(err, 'Amal muvaffaqiyatsiz'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-xl font-medium">Kitoblar CMS</h1>
        <p className="mt-1 text-sm text-nur-muted">Status oqimi va soft delete.</p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

      <form onSubmit={(e) => void onCreate(e)} className="space-y-3 border-b border-nur-line pb-8">
        <h2 className="text-sm text-nur-muted">Yangi kitob (draft)</h2>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sarlavha"
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <input
          required
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Mualliflar (vergul bilan)"
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tavsif"
          rows={3}
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <input
          required
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="Cover URL"
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={busy}>
          Draft yaratish
        </Button>
      </form>

      <div>
        <label className="mb-3 flex items-center gap-2 text-sm text-nur-muted">
          Status filter
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-2 py-1"
          >
            <option value="">Hammasi</option>
            <option value="draft">draft</option>
            <option value="in_review">in_review</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <ul className="divide-y divide-nur-line">
          {items.map((item) => (
            <li key={item.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-nur-faint">{item.slug}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <ContentWorkflowActions
                status={item.status}
                busy={busy}
                onStatus={(status: EditorialStatus) =>
                  void run(() => adminSetBookStatus(item.id, status))
                }
                onPublish={() => void run(() => adminPublishBook(item.id))}
                onSoftDelete={() => {
                  if (!window.confirm('Soft delete qilinsinmi?')) return;
                  void run(() => adminDeleteBook(item.id));
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
