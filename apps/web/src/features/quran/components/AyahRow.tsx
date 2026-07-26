import { Bookmark, BookmarkCheck, Play } from 'lucide-react';
import { cx } from '@/shared/lib/cx';
import type { Ayah } from '@/features/quran/types/quran.types';

type AyahRowProps = {
  ayah: Ayah;
  fontSize: number;
  showTranslation: boolean;
  isActive: boolean;
  isBookmarked: boolean;
  canBookmark: boolean;
  onPlay: () => void;
  onToggleBookmark: () => void;
  onFocus: () => void;
};

export function AyahRow({
  ayah,
  fontSize,
  showTranslation,
  isActive,
  isBookmarked,
  canBookmark,
  onPlay,
  onToggleBookmark,
  onFocus,
}: AyahRowProps) {
  const size = Math.max(fontSize, 32);

  return (
    <article
      id={`ayah-${ayah.ayahNumber}`}
      className={cx(
        'nur-ayah-card group scroll-mt-28 transition-[box-shadow,border-color,transform] duration-250',
        isActive && 'border-nur-accent/35 shadow-[var(--shadow-sm)] ring-1 ring-nur-accent/15',
      )}
      onClick={onFocus}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span
          className={cx('nur-ayah-number', isActive && 'nur-ayah-number-active')}
          aria-label={`${ayah.ayahNumber}-oyat`}
        >
          {ayah.ayahNumber}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-nur-muted transition-colors hover:bg-nur-accent-soft hover:text-nur-accent"
            aria-label={`${ayah.ayahNumber}-oyatni tinglash`}
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
          >
            <Play size={17} strokeWidth={1.75} fill="currentColor" className="opacity-90" />
          </button>
          {canBookmark ? (
            <button
              type="button"
              className={cx(
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-nur-muted transition-colors hover:bg-nur-accent-soft hover:text-nur-accent',
                isBookmarked && 'text-nur-accent',
              )}
              aria-label={isBookmarked ? 'Xatcho‘pni olib tashlash' : 'Xatcho‘p qo‘shish'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
            >
              {isBookmarked ? (
                <BookmarkCheck size={17} strokeWidth={1.75} />
              ) : (
                <Bookmark size={17} strokeWidth={1.75} />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Arabic on cream sacred plane — high contrast dark ink */}
      <div className="rounded-[var(--radius-l)] bg-[var(--nur-quran-bg)] px-4 py-6 md:px-6 md:py-7">
        <p
          className="nur-ayah-arabic"
          dir="rtl"
          lang="ar"
          style={{ fontSize: `${size}px` }}
        >
          {ayah.textArabic}
        </p>
      </div>

      {showTranslation && ayah.textUz ? (
        <p className="nur-ayah-translation" lang="uz-Cyrl">
          {ayah.textUz}
        </p>
      ) : null}
    </article>
  );
}
