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
  const size = Math.max(fontSize, 30);

  return (
    <article
      id={`ayah-${ayah.ayahNumber}`}
      className={cx(
        'group relative scroll-mt-28 py-8 transition-colors duration-300 md:py-10',
        isActive && 'bg-[color-mix(in_srgb,var(--nur-lamp)_6%,transparent)]',
      )}
      onClick={onFocus}
    >
      {/* Ornamental ayah number — floats beside the verse */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <span
          className={cx(
            'inline-flex h-9 min-w-9 items-center justify-center rounded-full font-display text-xs font-medium tabular-nums transition-colors',
            isActive
              ? 'bg-nur-lamp text-nur-lamp-ink shadow-[0_0_20px_color-mix(in_srgb,var(--nur-lamp)_30%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--nur-lamp)_12%,transparent)] text-[var(--nur-quran-ornament)]',
          )}
          aria-label={`${ayah.ayahNumber}-oyat`}
        >
          {ayah.ayahNumber}
        </span>

        <div
          className={cx(
            'flex items-center gap-0.5 opacity-70 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100',
            isActive && '!opacity-100',
          )}
        >
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--nur-quran-muted)] transition-colors hover:bg-black/5 hover:text-nur-accent"
            aria-label={`${ayah.ayahNumber}-oyatni tinglash`}
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
          >
            <Play size={16} strokeWidth={1.6} />
          </button>
          {canBookmark ? (
            <button
              type="button"
              className={cx(
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--nur-quran-muted)] transition-colors hover:bg-black/5 hover:text-nur-lamp',
                isBookmarked && 'text-nur-lamp',
              )}
              aria-label={isBookmarked ? 'Xatcho‘pni olib tashlash' : 'Xatcho‘p qo‘shish'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
            >
              {isBookmarked ? (
                <BookmarkCheck size={16} strokeWidth={1.6} />
              ) : (
                <Bookmark size={16} strokeWidth={1.6} />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Arabic — primary reading plane */}
      <p
        className="font-quran mx-auto max-w-[40rem] text-center leading-[2.15] text-[var(--nur-quran-ink)] md:text-right"
        dir="rtl"
        lang="ar"
        style={{ fontSize: `${size}px` }}
      >
        {ayah.textArabic}
      </p>

      {/* Translation — secondary, quiet, not a second card */}
      {showTranslation && ayah.textUz ? (
        <p
          className="mx-auto mt-6 max-w-[34rem] border-s-2 border-[color-mix(in_srgb,var(--nur-lamp)_35%,transparent)] ps-4 text-start text-[0.9375rem] leading-[1.85] text-[var(--nur-quran-muted)] md:text-base"
          lang="uz-Cyrl"
        >
          {ayah.textUz}
        </p>
      ) : null}

      <div
        className="mx-auto mt-8 h-px max-w-[12rem] bg-[color-mix(in_srgb,var(--nur-quran-ornament)_22%,transparent)]"
        aria-hidden
      />
    </article>
  );
}
