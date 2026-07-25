import { cx } from '@/shared/lib/cx';
import type { PropsWithChildren, ReactNode } from 'react';

type PageShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  wide?: boolean;
  actions?: ReactNode;
  className?: string;
}>;

export function PageShell({
  title,
  description,
  wide,
  actions,
  className,
  children,
}: PageShellProps) {
  return (
    <section className={cx('nur-page nur-fade-in', wide && 'nur-page-wide', className)}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <div className="min-w-0">
          <h1 className="nur-page-title">{title}</h1>
          {description ? <p className="nur-page-lede">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
