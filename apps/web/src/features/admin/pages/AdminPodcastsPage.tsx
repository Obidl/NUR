import { useEffect, useState, type FormEvent } from 'react';
import {
  adminCreatePodcastEpisode,
  adminCreatePodcastSeries,
  adminDeletePodcastSeries,
  adminListPodcastEpisodes,
  adminListPodcastSeries,
  adminPublishPodcastEpisode,
  adminPublishPodcastSeries,
  adminSetPodcastSeriesStatus,
  adminUpdatePodcastEpisode,
  type AdminContentCard,
  type AdminEpisodeRow,
  type EditorialStatus,
} from '@/features/admin/api/adminApi';
import { ContentWorkflowActions } from '@/features/admin/components/ContentWorkflowActions';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';
import { isPlaceholderMediaUrl } from '@/shared/lib/media';

export function AdminPodcastsPage() {
  const [items, setItems] = useState<AdminContentCard[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<AdminEpisodeRow[]>([]);
  const [audioDrafts, setAudioDrafts] = useState<Record<string, string>>({});

  const [epTitle, setEpTitle] = useState('');
  const [epDescription, setEpDescription] = useState('');
  const [epAudioUrl, setEpAudioUrl] = useState('https://');
  const [epDurationMin, setEpDurationMin] = useState('30');
  const [epNumber, setEpNumber] = useState('');

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

  async function loadEpisodes(seriesId: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = await adminListPodcastEpisodes(seriesId);
      const drafts: Record<string, string> = {};
      for (const ep of rows) {
        drafts[ep.id] = ep.audioUrl;
      }
      setEpisodes(rows);
      setAudioDrafts(drafts);
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
    setEpAudioUrl('https://');
    setEpDurationMin('30');
    setEpNumber('');
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

  async function onCreateSeries(event: FormEvent) {
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

  async function onCreateEpisode(event: FormEvent, seriesId: string, seriesStatus: string) {
    event.preventDefault();
    const minutes = Number(epDurationMin);
    if (!Number.isFinite(minutes) || minutes < 1) {
      setError('Davomiylik (daqiqa) noto‘g‘ri');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await adminCreatePodcastEpisode({
        seriesId,
        title: epTitle.trim(),
        description: epDescription.trim(),
        audioUrl: epAudioUrl.trim(),
        durationSeconds: Math.round(minutes * 60),
        episodeNumber: epNumber.trim() ? Number(epNumber) : null,
        rights: {
          licenseStatus: 'permission_granted',
          licenseNotes: 'Admin CMS — owner-provided licensed audio URL',
        },
      });
      if (seriesStatus === 'published') {
        await adminPublishPodcastEpisode(created.id);
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
      await adminPublishPodcastEpisode(episodeId);
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
        <h1 className="nur-page-title !text-xl">Podcast CMS</h1>
        <p className="mt-1 text-sm text-nur-muted">
          Seriya + epizod yaratish, audio URL, publish. Faqat litsenziyalangan manbalar.
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
          placeholder="Host / olim"
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
                      setEpisodes([]);
                      resetEpisodeForm();
                      return;
                    }
                    void loadEpisodes(item.id);
                  }}
                >
                  {expandedId === item.id ? 'Epizodlarni yopish' : 'Epizodlar'}
                </Button>
              </div>
              {expandedId === item.id ? (
                <div className="space-y-5 nur-surface bg-nur-sunken/30 p-4">
                  <ul className="space-y-4">
                    {episodes.map((ep) => (
                      <li key={ep.id} className="space-y-2 border-b border-nur-line/60 pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {ep.episodeNumber ? `${ep.episodeNumber}. ` : ''}
                            {ep.title}
                            {isPlaceholderMediaUrl(ep.audioUrl) ? (
                              <span className="ml-2 text-[10px] uppercase tracking-wide text-nur-faint">
                                placeholder
                              </span>
                            ) : null}
                          </p>
                          <StatusBadge status={ep.status} />
                        </div>
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
                        {ep.status !== 'published' && item.status !== 'published' ? (
                          <p className="text-[11px] text-nur-faint">
                            Avval seriyani publish qiling, keyin epizodni.
                          </p>
                        ) : null}
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
                    <h3 className="text-xs uppercase tracking-wide text-nur-faint">
                      Yangi epizod
                    </h3>
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
                      value={epAudioUrl}
                      onChange={(e) => setEpAudioUrl(e.target.value)}
                      placeholder="Audio URL (https://…)"
                      className="nur-input"
                    />
                    <div className="flex flex-wrap gap-2">
                      <input
                        required
                        type="number"
                        min={1}
                        value={epDurationMin}
                        onChange={(e) => setEpDurationMin(e.target.value)}
                        placeholder="Daqiqa"
                        className="w-28 rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={epNumber}
                        onChange={(e) => setEpNumber(e.target.value)}
                        placeholder="№ (ixtiyoriy)"
                        className="w-32 rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
                      />
                    </div>
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
