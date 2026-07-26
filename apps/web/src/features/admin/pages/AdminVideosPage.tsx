import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreateVideoEpisode,
  adminCreateVideoSeries,
  adminDeleteVideoSeries,
  adminListVideoEpisodes,
  adminListVideoSeries,
  adminPublishVideoEpisode,
  adminPublishVideoSeries,
  adminSetVideoSeriesStatus,
  adminUpdateVideoEpisode,
  type AdminContentCard,
  type AdminVideoEpisodeRow,
  type EditorialStatus,
} from '@/features/admin/api/adminApi';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

export function AdminVideosPage() {
  const [items, setItems] = useState<AdminContentCard[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://');
  const [channelUrl, setChannelUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<AdminVideoEpisodeRow[]>([]);
  const [videoDrafts, setVideoDrafts] = useState<Record<string, string>>({});

  const [epTitle, setEpTitle] = useState('');
  const [epDescription, setEpDescription] = useState('');
  const [epYoutube, setEpYoutube] = useState('');
  const [epNumber, setEpNumber] = useState('');

  async function reload(status?: string) {
    const result = await adminListVideoSeries({ status: status || undefined });
    setItems(result.items);
  }

  useEffect(() => {
    void reload(statusFilter).catch((err) =>
      setError(getErrorMessage(err, 'Ro‘yxat yuklanmadi')),
    );
  }, [statusFilter]);

  async function loadEpisodes(seriesId: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = await adminListVideoEpisodes(seriesId);
      const drafts: Record<string, string> = {};
      for (const ep of rows) {
        drafts[ep.id] = ep.youtubeVideoId;
      }
      setEpisodes(rows);
      setVideoDrafts(drafts);
      setExpandedId(seriesId);
    } catch (err) {
      setError(getErrorMessage(err, 'Epizodlar yuklanmadi'));
    } finally {
      setBusy(false);
    }
  }

  function resetEpisodeForm() {
    setEpTitle('');
    setEpDescription('');
    setEpYoutube('');
    setEpNumber('');
  }

  async function saveVideoId(episodeId: string) {
    const youtubeVideoId = videoDrafts[episodeId]?.trim();
    if (!youtubeVideoId) return;
    setBusy(true);
    setError(null);
    try {
      await adminUpdateVideoEpisode(episodeId, { youtubeVideoId });
      await loadEpisodes(expandedId!);
    } catch (err) {
      setError(getErrorMessage(err, 'Video ID saqlanmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateSeries(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminCreateVideoSeries({
        title: title.trim(),
        description: description.trim(),
        hostOrScholar: host.trim(),
        coverUrl: coverUrl.trim(),
        channelUrl: channelUrl.trim() || null,
        topics: ['siyrat'],
        rights: {
          licenseStatus: 'permission_granted',
          licenseNotes: 'YouTube embed / watch-on-platform; not rehosted. Editorial curated links.',
        },
      });
      setTitle('');
      setHost('');
      setDescription('');
      setChannelUrl('');
      await reload(statusFilter);
    } catch (err) {
      setError(getErrorMessage(err, 'Yaratilmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateEpisode(event: FormEvent, seriesId: string, seriesStatus: string) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await adminCreateVideoEpisode({
        seriesId,
        title: epTitle.trim(),
        description: epDescription.trim(),
        youtubeVideoId: epYoutube.trim(),
        episodeNumber: epNumber.trim() ? Number(epNumber) : null,
        rights: {
          licenseStatus: 'permission_granted',
          licenseNotes: 'YouTube embed / watch-on-platform; not rehosted.',
        },
      });
      if (seriesStatus === 'published') {
        await adminPublishVideoEpisode(created.id);
      }
      resetEpisodeForm();
      await loadEpisodes(seriesId);
    } catch (err) {
      setError(getErrorMessage(err, 'Epizod yaratilmadi'));
    } finally {
      setBusy(false);
    }
  }

  async function publishEpisode(seriesId: string, episodeId: string) {
    setBusy(true);
    setError(null);
    try {
      await adminPublishVideoEpisode(episodeId);
      await loadEpisodes(seriesId);
    } catch (err) {
      setError(getErrorMessage(err, 'Epizod chop etilmadi'));
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
        <h1 className="nur-page-title !text-xl">Videolar CMS</h1>
        <p className="mt-1 text-sm text-nur-muted">
          YouTube video ID / URL. Embed — qayta host yo‘q.
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

      <form
        onSubmit={(e) => void onCreateSeries(e)}
        className="space-y-3 border-b border-nur-line pb-8"
      >
        <h2 className="text-sm text-nur-muted">Yangi seriya (draft)</h2>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sarlavha"
          className="nur-input"
        />
        <input
          required
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Olim / kanal"
          className="nur-input"
        />
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tavsif (kamida 10 belgi)"
          rows={3}
          className="nur-input"
        />
        <input
          required
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="Cover URL"
          className="nur-input"
        />
        <input
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="Kanal URL (ixtiyoriy)"
          className="nur-input"
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
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  if (expandedId === item.id) {
                    setExpandedId(null);
                    setEpisodes([]);
                    resetEpisodeForm();
                    return;
                  }
                  void loadEpisodes(item.id);
                }}
              >
                {expandedId === item.id ? 'Epizodlarni yopish' : 'Epizodlar'}
              </Button>
              {expandedId === item.id ? (
                <div className="space-y-5 nur-surface bg-nur-sunken/30 p-4">
                  <ul className="space-y-4">
                    {episodes.map((ep) => (
                      <li
                        key={ep.id}
                        className="space-y-2 border-b border-nur-line/60 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {ep.episodeNumber ? `${ep.episodeNumber}. ` : ''}
                            {ep.title}
                          </p>
                          <StatusBadge status={ep.status} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <input
                            value={videoDrafts[ep.id] ?? ''}
                            onChange={(e) =>
                              setVideoDrafts((prev) => ({ ...prev, [ep.id]: e.target.value }))
                            }
                            placeholder="YouTube ID yoki URL"
                            className="min-w-[16rem] flex-1 nur-input"
                          />
                          <Button type="button" disabled={busy} onClick={() => void saveVideoId(ep.id)}>
                            Saqlash
                          </Button>
                          {ep.status !== 'published' ? (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy || item.status !== 'published'}
                              onClick={() => void publishEpisode(item.id, ep.id)}
                            >
                              Chop etish
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                    {episodes.length === 0 ? (
                      <p className="text-xs text-nur-faint">Hali epizod yo‘q.</p>
                    ) : null}
                  </ul>

                  <form
                    onSubmit={(e) => void onCreateEpisode(e, item.id, item.status)}
                    className="space-y-2 border-t border-nur-line pt-4"
                  >
                    <h3 className="text-xs uppercase tracking-wide text-nur-faint">Yangi epizod</h3>
                    <input
                      required
                      value={epTitle}
                      onChange={(e) => setEpTitle(e.target.value)}
                      placeholder="Epizod sarlavhasi"
                      className="nur-input"
                    />
                    <textarea
                      required
                      value={epDescription}
                      onChange={(e) => setEpDescription(e.target.value)}
                      placeholder="Tavsif (kamida 10 belgi)"
                      rows={2}
                      className="nur-input"
                    />
                    <input
                      required
                      value={epYoutube}
                      onChange={(e) => setEpYoutube(e.target.value)}
                      placeholder="YouTube ID yoki https://youtube.com/watch?v=…"
                      className="nur-input"
                    />
                    <input
                      type="number"
                      min={1}
                      value={epNumber}
                      onChange={(e) => setEpNumber(e.target.value)}
                      placeholder="№ (ixtiyoriy)"
                      className="w-32 nur-input"
                    />
                    <Button type="submit" disabled={busy}>
                      {item.status === 'published'
                        ? 'Yaratish va chop etish'
                        : 'Draft epizod yaratish'}
                    </Button>
                  </form>
                </div>
              ) : null}
              <ContentWorkflowActions
                status={item.status}
                busy={busy}
                onStatus={(status: EditorialStatus) =>
                  void run(() => adminSetVideoSeriesStatus(item.id, status))
                }
                onPublish={() => void run(() => adminPublishVideoSeries(item.id))}
                onSoftDelete={() => {
                  if (!window.confirm('Soft delete qilinsinmi?')) return;
                  void run(() => adminDeleteVideoSeries(item.id));
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
