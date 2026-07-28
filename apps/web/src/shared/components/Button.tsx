import { Link } from 'react-router-dom';
import { cx } from '@/shared/lib/cx';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClass: Record<Variant, string> = {
  primary:
    'bg-nur-accent text-[var(--nur-accent-ink)] shadow-[var(--shadow-xs)] hover:brightness-110 active:scale-[0.98]',
  secondary:
    'bg-transparent text-nur-ink border border-nur-line hover:bg-nur-elevated active:scale-[0.98]',
  ghost: 'bg-transparent text-nur-ink hover:bg-nur-elevated active:scale-[0.98]',
  danger:
    'bg-[var(--nur-danger)] text-white shadow-[var(--shadow-xs)] hover:brightness-95 active:scale-[0.98]',
};

const baseClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-m)] px-5 text-sm font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,border-color,filter,opacity] duration-150 ease-[var(--ease-out)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100';

type ButtonProps = PropsWithChildren<{
  variant?: Variant;
  className?: string;
  to?: string;
  state?: unknown;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  disabled?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  'aria-label'?: string;
}>;

export function Button({
  variant = 'primary',
  className,
  children,
  to,
  state,
  type = 'button',
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = cx(baseClass, variantClass[variant], className);

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className={classes}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
