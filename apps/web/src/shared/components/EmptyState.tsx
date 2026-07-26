import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/shared/components/Button';
import { cx } from '@/shared/lib/cx';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        'nur-empty flex flex-col items-center px-8 py-14 text-center md:px-12 md:py-16',
        className,
      )}
    >
      <div
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-[var(--radius-m)] bg-nur-sunken text-nur-muted"
        aria-hidden
      >
        {icon ?? <Inbox className="h-5 w-5" strokeWidth={1.75} />}
      </div>
      <h2 className="text-base font-semibold tracking-[-0.015em] text-nur-ink">{title}</h2>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-nur-muted">{description}</p>
      {actionLabel && (actionTo || onAction) ? (
        <div className="mt-7">
          <Button to={actionTo} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
