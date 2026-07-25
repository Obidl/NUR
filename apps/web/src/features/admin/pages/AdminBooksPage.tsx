import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreateBook,
  adminCreateBookChapter,
  adminDeleteBook,
  adminListBookChapters,
  adminListBooks,
  adminPublishBook,
  adminPublishBookChapter,
  adminSetBookStatus,
  adminUpdateBookChapter,
  type AdminChapterRow,
  type AdminContentCard,
  type EditorialStatus,
} from '@/features/admin/api/adminApi';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

const STUB_HINT = 'EXAMPLE — NOT FOR PRODUCTION';

export function AdminBooksPage() {
  const [items, setItems] = useState<AdminContentCard[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<AdminChapterRow[]>([]);
  const [bodyDrafts, setBodyDrafts] = useState<Record<string, string>>({});

  const [chTitle, setChTitle] = useState('');
  const [chOrder, setChOrder] = useState('1');
  const [chBody, setChBody] = useState('<p></p>');

  async function reload(status?: string) {
    const result = await adminListBooks({ status: status || undefined });
    setItems(result.items);
  }

  useEffect(() => {
    void reload(statusFilter).catch((err) =>
      setError(getErrorMessage(err, 'Ro‘yxat yuklanmadi')),
    );
  }, [statusFilter]);

  async function loadChapters(bookId: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = await adminListBookChapters(bookId);
      const drafts: Record<string, string> = {};
      for (const ch of rows) {
        drafts[ch.id] = ch.body;
      }
      setChapters(rows);
      setBodyDrafts(drafts);
      setExpandedId(bookId);
      setChOrder(String((rows.at(-1)?.order ?? 0) + 1));
    } catch (err) {
      setError(getErrorMessage(err, 'Boblar yuklanmadi'));
    } finally {
      setBusy(false);
    }
  }

  function resetChapterForm(nextOrder = '1') {
    setChTitle('');
    setChOrder(nextOrder);
    setChBody('<p></p>');
  }

  async function saveBody(chapterId: string) {
    const body = bodyDrafts[chapterId]?.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await adminUpdateBookChapter(chapterId, { body });
      setChapters((prev) =>
        prev.map((ch) => (ch.id === chapterId ? { ...ch, body } : ch)),
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Matn saqlanmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateBook(event: FormEvent) {
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

  async function onCreateChapter(event: FormEvent, bookId: string, bookStatus: string) {
    event.preventDefault();
    const order = Number(chOrder);
    if (!Number.isFinite(order) || order < 1) {
      setError('Bob tartibi noto‘g‘ri');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await adminCreateBookChapter({
        bookId,
        title: chTitle.trim(),
        order,
        body: chBody.trim() || `<p>${STUB_HINT}</p>`,
        bodyFormat: 'html',
      });
      if (bookStatus === 'published') {
        await adminPublishBookChapter(created.id);
      }
      resetChapterForm(String(order + 1));
      await loadChapters(bookId);
    } catch (err) {
      setError(getErrorMessage(err, 'Bob yaratilmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function publishChapter(bookId: string, chapterId: string) {
    setBusy(true);
    setError(null);
    try {
      await adminPublishBookChapter(chapterId);
      await loadChapters(bookId);
    } catch (err) {
      setError(getErrorMessage(err, 'Bob chop etilmadi'));
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
        <p className="mt-1 text-sm text-nur-muted">
          Kitob + bob yaratish, HTML matn, publish. Faqat litsenziyalangan matn.
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

      <form
        onSubmit={(e) => void onCreateBook(e)}
        className="space-y-3 border-b border-nur-line pb-8"
      >
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
          placeholder="Tavsif (kamida 10 belgi)"
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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (expandedId === item.id) {
                      setExpandedId(null);
                      setChapters([]);
                      resetChapterForm();
                      return;
                    }
                    void loadChapters(item.id);
                  }}
                >
                  {expandedId === item.id ? 'Boblarni yopish' : 'Boblar'}
                </Button>
              </div>
              {expandedId === item.id ? (
                <div className="space-y-5 rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/40 p-3">
                  <ul className="space-y-4">
                    {chapters.map((ch) => {
                      const isStub = ch.body.includes(STUB_HINT) || ch.body.trim().length < 40;
                      return (
                        <li
                          key={ch.id}
                          className="space-y-2 border-b border-nur-line/60 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {ch.order}. {ch.title}
                              {isStub ? (
                                <span className="ml-2 text-[10px] uppercase tracking-wide text-nur-faint">
                                  stub
                                </span>
                              ) : null}
                            </p>
                            <StatusBadge status={ch.status} />
                          </div>
                          <textarea
                            value={bodyDrafts[ch.id] ?? ''}
                            onChange={(e) =>
                              setBodyDrafts((prev) => ({ ...prev, [ch.id]: e.target.value }))
                            }
                            rows={4}
                            placeholder="HTML matn (litsenziyalangan)"
                            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 font-mono text-xs"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              disabled={busy}
                              onClick={() => void saveBody(ch.id)}
                            >
                              Matnni saqlash
                            </Button>
                            {ch.status !== 'published' ? (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={busy || item.status !== 'published'}
                                onClick={() => void publishChapter(item.id, ch.id)}
                              >
                                Chop etish
                              </Button>
                            ) : null}
                          </div>
                          {ch.status !== 'published' && item.status !== 'published' ? (
                            <p className="text-[11px] text-nur-faint">
                              Avval kitobni publish qiling, keyin bobni.
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                    {chapters.length === 0 ? (
                      <p className="text-xs text-nur-faint">Hali bob yo‘q.</p>
                    ) : null}
                  </ul>

                  <form
                    onSubmit={(e) => void onCreateChapter(e, item.id, item.status)}
                    className="space-y-2 border-t border-nur-line pt-4"
                  >
                    <h3 className="text-xs uppercase tracking-wide text-nur-faint">Yangi bob</h3>
                    <input
                      required
                      value={chTitle}
                      onChange={(e) => setChTitle(e.target.value)}
                      placeholder="Bob sarlavhasi"
                      className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      value={chOrder}
                      onChange={(e) => setChOrder(e.target.value)}
                      placeholder="Tartib"
                      className="w-28 rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
                    />
                    <textarea
                      required
                      value={chBody}
                      onChange={(e) => setChBody(e.target.value)}
                      placeholder="HTML matn"
                      rows={3}
                      className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 font-mono text-xs"
                    />
                    <Button type="submit" disabled={busy}>
                      {item.status === 'published'
                        ? 'Yaratish va chop etish'
                        : 'Draft bob yaratish'}
                    </Button>
                  </form>
                </div>
              ) : null}
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
