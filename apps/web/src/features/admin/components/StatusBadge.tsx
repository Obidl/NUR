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
        'inline-block rounded-[var(--radius-s)] px-2 py-0.5 text-xs',
        status === 'published' && 'bg-nur-lamp-soft text-nur-lamp-ink',
        status === 'in_review' && 'bg-nur-accent-soft text-nur-ink',
        status === 'draft' && 'bg-nur-sunken text-nur-muted',
        status === 'archived' && 'bg-nur-line text-nur-faint',
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
