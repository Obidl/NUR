import { Link } from 'react-router-dom';
import { cx } from '@/shared/lib/cx';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClass: Record<Variant, string> = {
  primary: 'bg-nur-lamp text-nur-lamp-ink hover:opacity-95',
  secondary: 'bg-nur-elevated text-nur-ink border border-nur-line hover:bg-nur-sunken',
  ghost: 'bg-transparent text-nur-ink hover:bg-nur-sunken',
};

const baseClass =
  'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-m)] px-5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50';

type ButtonProps = PropsWithChildren<{
  variant?: Variant;
  className?: string;
  to?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  disabled?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}>;

export function Button({
  variant = 'primary',
  className,
  children,
  to,
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const classes = cx(baseClass, variantClass[variant], className);

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled || undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
