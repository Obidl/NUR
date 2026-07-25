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
        'border-b border-nur-line/70 py-6 transition-colors',
        isActive && 'bg-nur-lamp-soft/40',
      )}
      onClick={onFocus}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-nur-line px-2 text-xs text-nur-muted">
          {ayah.ayahNumber}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-s)] text-nur-accent hover:bg-nur-accent-soft"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-s)] text-nur-lamp hover:bg-nur-lamp-soft"
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
        className="font-quran text-right leading-[1.9] text-[var(--nur-quran-ink)]"
        dir="rtl"
        lang="ar"
        style={{ fontSize: `${fontSize}px` }}
      >
        {ayah.textArabic}
      </p>

      {showTranslation && ayah.textUz ? (
        <p className="mt-3 text-sm leading-7 text-nur-muted md:text-base">{ayah.textUz}</p>
      ) : null}
    </article>
  );
}
