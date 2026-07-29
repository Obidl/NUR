import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BookMarked,
  BookOpen,
  Home,
  Library,
  LogIn,
  Mic2,
  Route,
  ScrollText,
  Search,
  Settings,
  Video,
} from 'lucide-react';
import { globalSearch } from '@/features/search/api/searchApi';
import type { SearchHit } from '@/features/search/types/search.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCommandPaletteStore } from '@/features/shell/store/commandPaletteStore';
import { getErrorMessage } from '@/shared/lib/errors';
import { cx } from '@/shared/lib/cx';

type NavAction = {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: typeof Home;
  keywords: string;
};

const TYPE_LABEL: Record<SearchHit['type'], string> = {
  quran: 'Qur’on',
  podcasts: 'Podcast',
  videos: 'Video',
  books: 'Kitob',
  research: 'Tadqiqot',
};

function buildNavActions(authed: boolean): NavAction[] {
  const base: NavAction[] = [
    {
      id: 'home',
      label: 'Bugun',
      hint: 'Bugungi yo‘l',
      href: '/',
      icon: Home,
      keywords: 'home bosh bugun',
    },
    {
      id: 'quran',
      label: 'Qur’on',
      hint: 'Surahlar',
      href: '/quran',
      icon: ScrollText,
      keywords: 'quran quron surah',
    },
    {
      id: 'videos',
      label: 'Videolar',
      hint: 'Siyrat darslar',
      href: '/videos',
      icon: Video,
      keywords: 'video siyrat',
    },
    {
      id: 'podcasts',
      label: 'Podcastlar',
      hint: 'Audio seriyalar',
      href: '/podcasts',
      icon: Mic2,
      keywords: 'podcast audio',
    },
    {
      id: 'books',
      label: 'Kitoblar',
      hint: 'O‘qish',
      href: '/books',
      icon: BookOpen,
      keywords: 'kitob book',
    },
    {
      id: 'research',
      label: 'Tadqiqot',
      hint: 'Manbali maqolalar',
      href: '/research',
      icon: BookMarked,
      keywords: 'tadqiqot research',
    },
    {
      id: 'curriculum',
      label: 'Yo‘llar',
      hint: 'O‘quv yo‘li',
      href: '/curriculum',
      icon: Route,
      keywords: 'yol curriculum path',
    },
    {
      id: 'search',
      label: 'Qidiruv',
      hint: 'To‘liq qidiruv sahifasi',
      href: '/search',
      icon: Search,
      keywords: 'search qidiruv',
    },
    {
      id: 'library',
      label: 'Kutubxona',
      hint: 'Davom va xatcho‘plar',
      href: '/library',
      icon: Library,
      keywords: 'kutubxona library davom',
    },
  ];

  if (authed) {
    base.push({
      id: 'settings',
      label: 'Sozlamalar',
      hint: 'Profil',
      href: '/settings',
      icon: Settings,
      keywords: 'settings sozlama profil',
    });
  } else {
    base.push({
      id: 'login',
      label: 'Kirish',
      hint: 'Hisob',
      href: '/login',
      icon: LogIn,
      keywords: 'login kirish',
    });
  }

  return base;
}

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const navActions = useMemo(
    () => buildNavActions(Boolean(accessToken)),
    [accessToken],
  );

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navActions;
    return navActions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q) ||
        item.keywords.includes(q),
    );
  }, [navActions, query]);

  const items = useMemo(() => {
    const navItems = filteredNav.map((action) => ({
      kind: 'nav' as const,
      id: action.id,
      label: action.label,
      hint: action.hint,
      href: action.href,
      icon: action.icon,
    }));
    const hitItems = hits.map((hit) => ({
      kind: 'hit' as const,
      id: `${hit.type}-${hit.href}`,
      label: hit.title,
      hint: `${TYPE_LABEL[hit.type]} · ${hit.snippet}`,
      href: hit.href,
      icon: Search,
    }));
    return [...navItems, ...hitItems];
  }, [filteredNav, hits]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setError(null);
      setActiveIndex(0);
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, hits.length, filteredNav.length]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setHits([]);
      setSearching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);
      void globalSearch({ q })
        .then((rows) => {
          if (!cancelled) setHits(rows.slice(0, 8));
        })
        .catch((err) => {
          if (!cancelled) {
            setHits([]);
            setError(getErrorMessage(err, 'Qidiruv amalga oshmadi'));
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  function close() {
    setOpen(false);
  }

  function go(href: string) {
    close();
    navigate(href);
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-[color-mix(in_srgb,var(--nur-ink)_35%,transparent)] px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={inputId}
            className="w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)] border border-nur-line bg-nur-elevated shadow-[var(--shadow-md)]"
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-nur-line px-4">
              <Search size={18} className="shrink-0 text-nur-faint" aria-hidden />
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sahifa yoki kontent qidirish…"
                className="h-14 w-full bg-transparent text-sm text-nur-ink outline-none placeholder:text-nur-faint"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  items[activeIndex] ? `cmdk-item-${items[activeIndex].id}` : undefined
                }
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    close();
                    return;
                  }
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
                    return;
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                    return;
                  }
                  if (event.key === 'Enter' && items[activeIndex]) {
                    event.preventDefault();
                    go(items[activeIndex].href);
                  }
                }}
              />
              <kbd className="hidden shrink-0 rounded-[var(--radius-s)] bg-nur-sunken px-1.5 py-1 text-[10px] font-medium tracking-wide text-nur-muted sm:inline">
                ESC
              </kbd>
            </div>

            <div
              id={listId}
              role="listbox"
              className="max-h-[min(22rem,50vh)] overflow-y-auto py-2"
            >
              {error ? (
                <p className="px-4 py-3 text-sm text-[var(--nur-danger)]">{error}</p>
              ) : null}

              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-nur-muted">
                  {searching ? 'Qidirilmoqda…' : 'Natija yo‘q'}
                </p>
              ) : (
                <ul>
                  {filteredNav.length > 0 ? (
                    <li className="px-4 pt-1 pb-1 text-[10px] font-semibold tracking-[0.08em] text-nur-faint uppercase">
                      Sahifalar
                    </li>
                  ) : null}
                  {items.map((item, index) => {
                    const Icon = item.icon;
                    const active = index === activeIndex;
                    const showHitHeader =
                      item.kind === 'hit' &&
                      (index === 0 || items[index - 1]?.kind === 'nav');
                    return (
                      <li key={item.id}>
                        {showHitHeader ? (
                          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-[0.08em] text-nur-faint uppercase">
                            Kontent {searching ? '· …' : ''}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          id={`cmdk-item-${item.id}`}
                          role="option"
                          aria-selected={active}
                          className={cx(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
                            active ? 'bg-nur-accent-soft text-nur-ink' : 'hover:bg-nur-sunken/70',
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(item.href)}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-elevated text-nur-accent ring-1 ring-nur-line">
                            <Icon size={16} strokeWidth={1.75} aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{item.label}</span>
                            <span className="mt-0.5 block truncate text-xs text-nur-muted">
                              {item.hint}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-nur-line px-4 py-2.5 text-[11px] text-nur-faint">
              <span>↑↓ tanlash · Enter ochish</span>
              <span className="hidden sm:inline">⌘K / Ctrl+K</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
