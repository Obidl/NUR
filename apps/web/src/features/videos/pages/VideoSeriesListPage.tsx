import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { fetchVideoSeries } from '@/features/videos/api/videoApi';
import type { VideoSeriesCard } from '@/features/videos/types/video.types';
import { useVideoWatchStore } from '@/features/videos/store/videoWatchStore';
import { CoverImage } from '@/shared/components/CoverImage';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Field';
import { PageShell } from '@/shared/components/PageShell';
import { ErrorState, ListSkeleton } from '@/shared/components/Skeleton';
import { getErrorMessage } from '@/shared/lib/errors';
import { displayTitle } from '@/features/home/lib/todayPath';

type CatalogSection = {
  id: string;
  title: string;
  description: string;
  match: (series: VideoSeriesCard) => boolean;
};

const SECTIONS: CatalogSection[] = [
  {
    id: 'siyrat-dars',
    title: 'Siyrat darslar',
    description: 'Rasululloh ﷺ hayoti — asosiy ketma-ket kurslar',
    match: (s) => s.topics.includes('siyrat-dars'),
  },
  {
    id: 'ustoz',
    title: 'Ustozlar — Payg‘ambar ﷺ',
    description: 'Nouman Ali Khan, Hasanxon & Husaynxon — siyrat / Prophet ﷺ',
    match: (s) => s.topics.includes('ustoz'),
  },
  {
    id: 'umumiy',
    title: 'Umumiy videolar',
    description: 'Shu ustozlarning boshqa (siyratsiz) suhbatlari — alohida',
    match: (s) => s.topics.includes('umumiy'),
  },
];

function SeriesRow({ series }: { series: VideoSeriesCard }) {
  return (
    <li>
      <Link to={`/videos/${series.slug}`} className="nur-list-row">
        <CoverImage
          src={series.coverUrl}
          className="h-14 w-24 shrink-0 rounded-[var(--radius-m)] object-cover shadow-[var(--shadow-xs)]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-[-0.01em]">{series.title}</p>
          <p className="mt-1 truncate text-sm text-nur-muted">{series.hostOrScholar}</p>
          <p className="mt-1 text-xs text-nur-faint">
            {series.episodeCount} ta video · ketma-ket
          </p>
        </div>
      </Link>
    </li>
  );
}

export function VideoSeriesListPage() {
  const [items, setItems] = useState<VideoSeriesCard[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const continueItem = useVideoWatchStore((s) => s.recent[0] ?? null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchVideoSeries({ q: query || undefined, limit: 50 });
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Videolar yuklanmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  const grouped = useMemo(() => {
    const used = new Set<string>();
    const sections = SECTIONS.map((section) => {
      const rows = items.filter((s) => section.match(s));
      rows.forEach((r) => used.add(r.id));
      return { ...section, rows };
    });
    const other = items.filter((s) => !used.has(s.id));
    return { sections, other };
  }, [items]);

  return (
    <PageShell
      title="Videolar"
      description="Siyrat darslar alohida · ustozlar · umumiy — ilova ichida."
    >
      {continueItem ? (
        <div className="mb-8">
          <h2 className="nur-section-title mb-3">Davom ettirish</h2>
          <Link
            to={`/videos/${continueItem.seriesSlug}?episode=${continueItem.episodeId}`}
            className="nur-list-row border border-nur-line bg-nur-elevated"
          >
            <CoverImage
              src={continueItem.coverUrl}
              className="h-16 w-28 shrink-0 rounded-[var(--radius-m)] object-cover shadow-[var(--shadow-xs)]"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-nur-lamp">Oxirgi ko‘rilgan</p>
              <p className="mt-1 truncate text-sm font-semibold tracking-[-0.01em]">
                {continueItem.episodeNumber ? `${continueItem.episodeNumber}. ` : ''}
                {displayTitle(continueItem.episodeTitle)}
              </p>
              <p className="mt-1 truncate text-sm text-nur-muted">
                {displayTitle(continueItem.seriesTitle)} · {continueItem.hostOrScholar}
              </p>
            </div>
          </Link>
        </div>
      ) : null}

      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Qidirish…"
        className="mb-6"
        aria-label="Video qidiruv"
      />

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      {loading ? <ListSkeleton rows={4} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Video className="h-5 w-5" strokeWidth={1.75} />}
          title="Hali video yo‘q"
          description="Nashr qilingan seriya bo‘sh. Admin orqali YouTube video ID qo‘shiladi."
        />
      ) : null}

      {!loading && items.length > 0
        ? grouped.sections.map((section) =>
            section.rows.length === 0 ? null : (
              <section key={section.id} className="mb-10">
                <h2 className="nur-section-title">{section.title}</h2>
                <p className="mt-1 mb-4 text-xs text-nur-faint">{section.description}</p>
                <ul className="nur-list">
                  {section.rows.map((series) => (
                    <SeriesRow key={series.id} series={series} />
                  ))}
                </ul>
              </section>
            ),
          )
        : null}

      {!loading && grouped.other.length > 0 ? (
        <section className="mb-10">
          <h2 className="nur-section-title">Boshqa</h2>
          <ul className="nur-list mt-4">
            {grouped.other.map((series) => (
              <SeriesRow key={series.id} series={series} />
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
