import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cx } from '@/shared/lib/cx';

export function DetailBackLink({
  to,
  children,
  className,
}: {
  to: string;
  children: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cx(
        'inline-flex items-center gap-1 text-sm text-nur-muted transition-colors duration-200 hover:text-nur-ink',
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      {children}
    </Link>
  );
}
