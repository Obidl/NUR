import { Link } from 'react-router-dom';
import { cx } from '@/shared/lib/cx';

type BrandMarkProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { img: 'h-7 w-7', text: 'text-base' },
  md: { img: 'h-8 w-8', text: 'text-lg' },
  lg: { img: 'h-11 w-11', text: 'text-2xl' },
} as const;

export function BrandMark({
  to,
  size = 'md',
  showWordmark = true,
  className,
}: BrandMarkProps) {
  const s = sizeMap[size];
  const content = (
    <>
      <img
        src="/favicon.svg"
        alt=""
        width={44}
        height={44}
        className={cx(s.img, 'rounded-[22%] object-cover')}
        aria-hidden
      />
      {showWordmark ? (
        <span className={cx(s.text, 'font-semibold tracking-[-0.02em] text-nur-accent')}>
          Odatnoma
        </span>
      ) : null}
    </>
  );

  if (!to) {
    return (
      <span className={cx('inline-flex items-center gap-2.5', className)} aria-label="Odatnoma">
        {content}
      </span>
    );
  }

  return (
    <Link
      to={to}
      className={cx(
        'inline-flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80',
        className,
      )}
      aria-label="Odatnoma bosh sahifa"
    >
      {content}
    </Link>
  );
}
