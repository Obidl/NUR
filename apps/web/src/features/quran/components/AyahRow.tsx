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
  return (
    <article
      id={`ayah-${ayah.ayahNumber}`}
      className={cx(
        'border-b border-nur-line/40 py-7 transition-colors md:py-8',
        isActive && 'bg-nur-lamp-soft/30',
      )}
      onClick={onFocus}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-nur-line/60 px-2 text-xs text-[var(--nur-quran-muted)]">
          {ayah.ayahNumber}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-m)] text-nur-accent transition-colors hover:bg-nur-accent-soft"
            aria-label={`${ayah.ayahNumber}-oyatni tinglash`}
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
          >
            <Play size={16} />
          </button>
          {canBookmark ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-m)] text-nur-lamp transition-colors hover:bg-nur-lamp-soft"
              aria-label={isBookmarked ? 'Xatcho‘pni olib tashlash' : 'Xatcho‘p qo‘shish'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          ) : null}
        </div>
      </div>

      <p
        className="font-quran text-right leading-[2] text-[var(--nur-quran-ink)]"
        dir="rtl"
        lang="ar"
        style={{ fontSize: `${fontSize}px` }}
      >
        {ayah.textArabic}
      </p>

      {showTranslation && ayah.textUz ? (
        <p
          className="mt-4 max-w-prose text-sm leading-8 text-[var(--nur-quran-muted)] md:text-[0.9375rem]"
          lang="uz-Cyrl"
        >
          {ayah.textUz}
        </p>
      ) : null}
    </article>
  );
}
