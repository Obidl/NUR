import { useState } from 'react';
import { cx } from '@/shared/lib/cx';
import { isPlaceholderMediaUrl } from '@/shared/lib/media';

type CoverImageProps = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
};

/** List/detail covers — fall back if placeholder host or load error. */
export function CoverImage({ src, alt = '', className }: CoverImageProps) {
  const initial = src && !isPlaceholderMediaUrl(src) ? src : null;
  const [failed, setFailed] = useState(false);
  const show = initial && !failed;

  if (!show) {
    return (
      <span
        className={cx(
          'inline-flex shrink-0 items-center justify-center overflow-hidden bg-nur-sunken',
          className,
        )}
        aria-hidden
      >
        <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover opacity-80" />
      </span>
    );
  }

  return (
    <img
      src={initial}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
