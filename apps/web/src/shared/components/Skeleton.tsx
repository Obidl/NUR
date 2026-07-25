import { cx } from '@/shared/lib/cx';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cx('nur-skeleton', className)} aria-hidden />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="nur-list" role="status" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="nur-list-row">
          <Skeleton className="h-14 w-14 shrink-0 rounded-[var(--radius-m)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[66%] max-w-[14rem]" />
            <Skeleton className="h-3 w-[48%] max-w-[10rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="nur-surface flex flex-col items-start gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between"
      role="alert"
    >
      <p className="text-sm leading-relaxed text-[var(--nur-danger)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-[var(--radius-m)] border border-nur-line bg-nur-elevated px-4 py-2 text-sm font-medium text-nur-ink transition-[background-color,transform] duration-200 hover:bg-nur-sunken active:scale-[0.98]"
        >
          Qayta urinish
        </button>
      ) : null}
    </div>
  );
}
