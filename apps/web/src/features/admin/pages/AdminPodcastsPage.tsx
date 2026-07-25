import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreatePodcastSeries,
  adminDeletePodcastSeries,
  adminListPodcastSeries,
  adminPublishPodcastSeries,
  adminSetPodcastSeriesStatus,
  adminUpdatePodcastEpisode,
  type AdminContentCard,
  type EditorialStatus,
} from '@/features/admin/api/adminApi';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { fetchPodcastEpisode, fetchPodcastSeriesDetail } from '@/features/podcasts/api/podcastApi';
import type { PodcastEpisodeSummary } from '@/features/podcasts/types/podcast.types';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';
import { isPlaceholderMediaUrl } from '@/shared/lib/media';

type EpisodeRow = PodcastEpisodeSummary & { audioUrl: string };

export function AdminPodcastsPage() {
  const [items, setItems] = useState<AdminContentCard[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [audioDrafts, setAudioDrafts] = useState<Record<string, string>>({});

  async function reload(status?: string) {
    const result = await adminListPodcastSeries({
      status: status || undefined,
    });
    setItems(result.items);
  }

  useEffect(() => {
    void reload(statusFilter).catch((err) =>
      setError(getErrorMessage(err, 'Ro‘yxat yuklanmadi')),
    );
  }, [statusFilter]);

  async function loadEpisodes(slug: string) {
    setBusy(true);
    setError(null);
    try {
      const detail = await fetchPodcastSeriesDetail(slug);
      const rows: EpisodeRow[] = [];
      const drafts: Record<string, string> = {};
      for (const ep of detail.episodes) {
        const full = await fetchPodcastEpisode(ep.id);
        rows.push({ ...ep, audioUrl: full.audioUrl });
        drafts[ep.id] = full.audioUrl;
      }
      setEpisodes(rows);
      setAudioDrafts(drafts);
      setExpandedSlug(slug);
    } catch (err) {
      setError(getErrorMessage(err, 'Epizodlar yuklanmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function saveAudio(episodeId: string) {
    const audioUrl = audioDrafts[episodeId]?.trim();
    if (!audioUrl) return;
    setBusy(true);
    setError(null);
    try {
      await adminUpdatePodcastEpisode(episodeId, { audioUrl });
      setEpisodes((prev) =>
        prev.map((ep) => (ep.id === episodeId ? { ...ep, audioUrl } : ep)),
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Audio URL saqlanmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminCreatePodcastSeries({
        title: title.trim(),
        description: description.trim(),
        hostOrScholar: host.trim(),
        coverUrl: coverUrl.trim(),
        rights: { licenseStatus: 'owned', licenseNotes: 'admin cms' },
      });
      setTitle('');
      setHost('');
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
        <h1 className="text-xl font-medium">Podcast CMS</h1>
        <p className="mt-1 text-sm text-nur-muted">
          Status oqimi, soft delete, va epizod audio URL (litsenziyalangan manba).
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

      <form onSubmit={(e) => void onCreate(e)} className="space-y-3 border-b border-nur-line pb-8">
        <h2 className="text-sm text-nur-muted">Yangi seriya (draft)</h2>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sarlavha"
          className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <input
          required
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Host / olim"
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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (expandedSlug === item.slug) {
                      setExpandedSlug(null);
                      setEpisodes([]);
                      return;
                    }
                    void loadEpisodes(item.slug);
                  }}
                >
                  {expandedSlug === item.slug ? 'Epizodlarni yopish' : 'Audio URL’lar'}
                </Button>
              </div>
              {expandedSlug === item.slug ? (
                <ul className="space-y-4 rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/40 p-3">
                  {episodes.map((ep) => (
                    <li key={ep.id} className="space-y-2">
                      <p className="text-sm font-medium">
                        {ep.episodeNumber ? `${ep.episodeNumber}. ` : ''}
                        {ep.title}
                        {isPlaceholderMediaUrl(ep.audioUrl) ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-nur-faint">
                            placeholder
                          </span>
                        ) : null}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={audioDrafts[ep.id] ?? ''}
                          onChange={(e) =>
                            setAudioDrafts((prev) => ({ ...prev, [ep.id]: e.target.value }))
                          }
                          placeholder="https://… (litsenziyalangan audio)"
                          className="min-w-[16rem] flex-1 rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
                        />
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveAudio(ep.id)}
                        >
                          Saqlash
                        </Button>
                      </div>
                    </li>
                  ))}
                  {episodes.length === 0 ? (
                    <p className="text-xs text-nur-faint">Epizod yo‘q yoki yuklanmoqda…</p>
                  ) : null}
                </ul>
              ) : null}
              <ContentWorkflowActions
                status={item.status}
                busy={busy}
                onStatus={(status: EditorialStatus) =>
                  void run(() => adminSetPodcastSeriesStatus(item.id, status))
                }
                onPublish={() => void run(() => adminPublishPodcastSeries(item.id))}
                onSoftDelete={() => {
                  if (!window.confirm('Soft delete qilinsinmi?')) return;
                  void run(() => adminDeletePodcastSeries(item.id));
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
