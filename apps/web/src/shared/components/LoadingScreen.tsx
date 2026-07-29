import { cx } from '@/shared/lib/cx';

type LoadingScreenProps = {
  message?: string;
  className?: string;
  fullscreen?: boolean;
};

/** Compact spinner — no heavy brand splash. */
export function LoadingScreen({
  message = 'Yuklanmoqda…',
  className,
  fullscreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center',
        fullscreen ? 'min-h-dvh px-6' : 'min-h-[30vh] px-4 py-10',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="nur-spinner h-7 w-7 rounded-full border-2 border-nur-line border-t-nur-accent"
        aria-hidden
      />
      <p className="mt-4 max-w-xs text-sm text-nur-muted">{message}</p>
    </div>
  );
}

/** Soft overlay only while a submit request is in flight. */
export function LoadingOverlay({
  message = 'Kutilmoqda…',
  hint,
}: {
  message?: string;
  hint?: string | null;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[inherit] bg-nur-elevated/92 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="nur-spinner h-8 w-8 rounded-full border-2 border-nur-line border-t-nur-accent"
        aria-hidden
      />
      <p className="mt-4 text-sm font-medium text-nur-ink">{message}</p>
      {hint ? (
        <p className="mt-2 max-w-[16rem] text-center text-xs leading-relaxed text-nur-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
