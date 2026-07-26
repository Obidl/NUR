import { cx } from '@/shared/lib/cx';

const LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'Ko‘rib chiqish',
  published: 'Nashr',
  archived: 'Arxiv',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cx(
        'inline-block rounded-[var(--radius-s)] px-2 py-0.5 text-[11px] font-medium tracking-wide',
        status === 'published' && 'bg-nur-accent-soft text-nur-accent',
        status === 'in_review' && 'bg-nur-sunken text-nur-ink',
        status === 'draft' && 'bg-nur-sunken text-nur-muted',
        status === 'archived' && 'bg-transparent text-nur-faint ring-1 ring-nur-line',
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
