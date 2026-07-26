import { Check, Bookmark, BookmarkCheck, Play } from 'lucide-react';
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
  return (
    <article
      id={`ayah-${ayah.ayahNumber}`}
      className={cx(
        'nur-surface mb-4 px-4 py-5 transition-[box-shadow,background-color] duration-250 md:px-5 md:py-6',
        isActive && 'ring-1 ring-nur-lamp/40 shadow-[var(--shadow-sm)]',
      )}
      onClick={onFocus}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white text-xs font-medium text-nur-muted ring-1 ring-nur-line">
          {ayah.ayahNumber}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-nur-muted transition-colors hover:bg-white hover:text-nur-accent"
            aria-label={`${ayah.ayahNumber}-oyatni tinglash`}
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
          >
            <Play size={16} strokeWidth={1.75} />
          </button>
          {canBookmark ? (
            <button
              type="button"
              className={cx(
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-nur-muted transition-[color,transform] duration-200 hover:bg-white hover:text-nur-lamp',
                isBookmarked && 'text-nur-lamp',
              )}
              aria-label={isBookmarked ? 'Xatcho‘pni olib tashlash' : 'Xatcho‘p qo‘shish'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
            >
              {isBookmarked ? <BookmarkCheck size={16} strokeWidth={1.75} /> : <Bookmark size={16} strokeWidth={1.75} />}
            </button>
          ) : null}
        </div>
      </div>

      <div className="nur-sacred">
        <p
          className="font-quran text-right leading-[2.05] text-[var(--nur-quran-ink)]"
          dir="rtl"
          lang="ar"
          style={{ fontSize: `${Math.max(fontSize, 28)}px` }}
        >
          {ayah.textArabic}
        </p>
      </div>

      {showTranslation && ayah.textUz ? (
        <p
          className="mt-4 max-w-prose text-sm leading-8 text-nur-muted md:text-[0.9375rem]"
          lang="uz-Cyrl"
        >
          {ayah.textUz}
        </p>
      ) : null}

      {isActive ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-nur-lamp">
          <Check size={12} strokeWidth={2} aria-hidden />
          Tinglanmoqda / o‘qilmoqda
        </p>
      ) : null}
    </article>
  );
}
