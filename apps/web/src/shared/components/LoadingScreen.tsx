import { cx } from '@/shared/lib/cx';

type LoadingScreenProps = {
  title?: string;
  message?: string;
  className?: string;
  /** Fill viewport (auth hydrate / cold start). */
  fullscreen?: boolean;
};

export function LoadingScreen({
  title = 'NUR',
  message = 'Yuklanmoqda…',
  className,
  fullscreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center',
        fullscreen ? 'min-h-dvh px-6' : 'min-h-[40vh] px-4 py-12',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="font-display text-3xl font-semibold tracking-[0.22em] text-nur-ink">{title}</p>
      <div
        className="nur-spinner mt-8 h-9 w-9 rounded-full border-2 border-nur-line border-t-nur-accent"
        aria-hidden
      />
      <p className="mt-5 max-w-xs text-sm leading-relaxed text-nur-muted">{message}</p>
    </div>
  );
}

/** Soft overlay over a surface (e.g. login card) while a request runs. */
export function LoadingOverlay({
  message = 'Kirish amalga oshirilmoqda…',
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
        className="nur-spinner h-9 w-9 rounded-full border-2 border-nur-line border-t-nur-accent"
        aria-hidden
      />
      <p className="mt-4 text-sm font-medium text-nur-ink">{message}</p>
      {hint ? <p className="mt-2 max-w-[16rem] text-center text-xs leading-relaxed text-nur-muted">{hint}</p> : null}
    </div>
  );
}
