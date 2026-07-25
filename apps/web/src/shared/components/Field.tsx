import { cx } from '@/shared/lib/cx';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
};

export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-2 block text-sm font-medium text-nur-ink">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1.5 block text-xs text-nur-faint">{hint}</span> : null}
      {error ? (
        <span className="mt-1.5 block text-sm text-[var(--nur-danger)]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cx('nur-input', invalid && 'border-[var(--nur-danger)]', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function TextArea({ className, invalid, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cx('nur-input', invalid && 'border-[var(--nur-danger)]', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
