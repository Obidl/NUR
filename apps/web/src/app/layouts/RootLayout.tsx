import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Home, MoreHorizontal, ScrollText, Video } from 'lucide-react';
import { cx } from '@/shared/lib/cx';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PodcastPlayerBar } from '@/features/podcasts/components/PodcastPlayerBar';

const desktopNav = [
  { to: '/', label: 'Bugun', end: true },
  { to: '/quran', label: 'Qur’on' },
  { to: '/videos', label: 'Videolar' },
  { to: '/podcasts', label: 'Podcastlar' },
  { to: '/books', label: 'Kitoblar' },
  { to: '/research', label: 'Tadqiqot' },
  { to: '/curriculum', label: 'Yo‘llar' },
  { to: '/search', label: 'Qidiruv' },
  { to: '/library', label: 'Kutubxona' },
] as const;

const mobileNav = [
  { to: '/', label: 'Bugun', end: true, icon: Home },
  { to: '/quran', label: 'Qur’on', icon: ScrollText },
  { to: '/videos', label: 'Video', icon: Video },
  { to: '/curriculum', label: 'Yo‘llar', icon: BookOpen },
  { to: '/more', label: 'Ko‘proq', icon: MoreHorizontal },
] as const;

export function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();
  const onMoreSection =
    pathname === '/more' ||
    pathname.startsWith('/podcasts') ||
    pathname.startsWith('/books') ||
    pathname.startsWith('/research') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/library') ||
    pathname.startsWith('/settings');

  return (
    <div className="flex min-h-dvh flex-col bg-nur-bg text-nur-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-m)] focus:bg-nur-accent focus:px-3 focus:py-2 focus:text-[var(--nur-accent-ink)]"
      >
        Asosiy kontentga o‘tish
      </a>

      <header className="sticky top-0 z-30 border-b border-nur-line/60 bg-[color-mix(in_srgb,var(--nur-bg)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <NavLink
            to="/"
            className="font-display text-lg font-semibold tracking-[0.22em] text-nur-ink transition-opacity duration-250 hover:opacity-70"
            aria-label="NUR bosh sahifa"
          >
            NUR
          </NavLink>

          <nav
            className="hidden items-center gap-0.5 text-sm md:flex"
            aria-label="Asosiy navigatsiya"
          >
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cx(
                    'rounded-[var(--radius-pill)] px-3.5 py-2 text-nur-muted transition-[color,background-color] duration-250',
                    isActive
                      ? 'bg-nur-elevated font-medium text-nur-ink'
                      : 'hover:bg-nur-elevated/70 hover:text-nur-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {accessToken ? (
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cx(
                    'ml-1 rounded-[var(--radius-pill)] px-3.5 py-2 text-nur-muted transition-colors duration-250',
                    isActive
                      ? 'bg-nur-elevated font-medium text-nur-ink'
                      : 'hover:bg-nur-elevated/70 hover:text-nur-ink',
                  )
                }
              >
                {user?.displayName ?? 'Profil'}
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="ml-1 rounded-[var(--radius-m)] bg-nur-accent px-4 py-2 font-semibold text-[var(--nur-accent-ink)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
              >
                Kirish
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            {accessToken ? (
              <NavLink
                to="/settings"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-nur-muted shadow-[var(--shadow-xs)] ring-1 ring-nur-line"
                aria-label="Sozlamalar"
              >
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'N'}
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="rounded-[var(--radius-m)] bg-nur-accent px-3 py-2 text-sm font-semibold text-[var(--nur-accent-ink)]"
              >
                Kirish
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        <Outlet />
      </main>

      <PodcastPlayerBar />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-nur-line/70 bg-[color-mix(in_srgb,var(--nur-bg)_92%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Mobil navigatsiya"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const forceActive = item.to === '/more' && onMoreSection && pathname !== '/';
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    cx(
                      'relative flex flex-col items-center gap-0.5 rounded-[var(--radius-m)] px-1 py-2 text-[10px] font-medium tracking-wide transition-colors duration-250',
                      isActive || forceActive ? 'text-nur-accent' : 'text-nur-muted',
                    )
                  }
                >
                  {({ isActive }) => {
                    const active = isActive || forceActive;
                    return (
                      <>
                        {active ? (
                          <span
                            className="absolute top-1 h-1 w-1 rounded-full bg-nur-accent"
                            aria-hidden
                          />
                        ) : null}
                        <Icon
                          className="mt-1 h-5 w-5"
                          aria-hidden
                          strokeWidth={active ? 2 : 1.5}
                        />
                        {item.label}
                      </>
                    );
                  }}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
