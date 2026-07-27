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
        'nur-ayah-card group scroll-mt-28 transition-[box-shadow,border-color] duration-250',
        isActive && 'border-[color-mix(in_srgb,var(--nur-quran-ornament)_28%,transparent)]',
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--nur-quran-muted)] transition-colors hover:bg-[var(--nur-quran-translation-plane)] hover:text-[var(--nur-quran-ornament)]"
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
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--nur-quran-muted)] transition-colors hover:bg-[var(--nur-quran-translation-plane)] hover:text-[var(--nur-quran-ornament)]',
                isBookmarked && 'text-[var(--nur-quran-ornament)]',
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

      <div className="nur-ayah-arabic-plane">
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
        <div className="nur-ayah-translation">
          <span className="nur-ayah-translation-label">Tarjima</span>
          <p lang="uz-Cyrl">{ayah.textUz}</p>
        </div>
      ) : null}
    </article>
  );
}
