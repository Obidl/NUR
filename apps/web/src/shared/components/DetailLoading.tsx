import { Skeleton } from '@/shared/components/Skeleton';

export function DetailLoading({ cover }: { cover?: boolean }) {
  return (
    <section className="nur-page nur-fade-in" aria-busy="true" aria-label="Yuklanmoqda">
      <Skeleton className="mb-8 h-4 w-28" />
      <div className="flex gap-5">
        {cover ? <Skeleton className="h-28 w-28 shrink-0 rounded-[var(--radius-l)]" /> : null}
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-[70%] max-w-sm" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </section>
  );
}
