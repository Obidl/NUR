import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Library, ScrollText, Search, Video } from 'lucide-react';
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
  { to: '/search', label: 'Qidir', icon: Search },
  { to: '/library', label: 'Kutub', icon: Library },
] as const;

export function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();
  const missionHome = pathname === '/';

  return (
    <div
      data-theme={missionHome ? 'dark' : undefined}
      className="flex min-h-dvh flex-col bg-nur-bg text-nur-ink"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-m)] focus:bg-nur-lamp focus:px-3 focus:py-2 focus:text-nur-lamp-ink"
      >
        Asosiy kontentga o‘tish
      </a>

      <header className="sticky top-0 z-30 border-b border-nur-line/50 bg-nur-elevated/80 backdrop-blur-xl supports-[backdrop-filter]:bg-nur-elevated/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          <NavLink
            to="/"
            className="font-display text-lg font-semibold tracking-[0.2em] text-nur-ink transition-opacity duration-200 hover:opacity-75"
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
                    'rounded-[var(--radius-m)] px-3 py-2 text-nur-muted transition-[color,background-color] duration-200',
                    isActive
                      ? 'bg-nur-sunken/80 font-medium text-nur-ink'
                      : 'hover:bg-nur-sunken/50 hover:text-nur-ink',
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
                    'ml-1 rounded-[var(--radius-m)] px-3 py-2 text-nur-muted transition-[color,background-color] duration-200',
                    isActive
                      ? 'bg-nur-sunken/80 font-medium text-nur-ink'
                      : 'hover:bg-nur-sunken/50 hover:text-nur-ink',
                  )
                }
              >
                {user?.displayName ?? 'Profil'}
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="ml-1 rounded-[var(--radius-m)] bg-nur-lamp px-3.5 py-2 font-semibold text-nur-lamp-ink transition-[filter,transform] duration-200 hover:brightness-[0.97] active:scale-[0.98]"
              >
                Kirish
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-0.5 md:hidden">
            <NavLink
              to="/curriculum"
              className="rounded-[var(--radius-m)] px-2.5 py-2 text-sm text-nur-muted transition-colors hover:text-nur-ink"
            >
              Yo‘llar
            </NavLink>
            {accessToken ? (
              <NavLink
                to="/settings"
                className="rounded-[var(--radius-m)] px-2.5 py-2 text-sm text-nur-muted transition-colors hover:text-nur-ink"
              >
                Profil
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="rounded-[var(--radius-m)] bg-nur-lamp px-3 py-2 text-sm font-semibold text-nur-lamp-ink"
              >
                Kirish
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        <Outlet />
      </main>

      <PodcastPlayerBar />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-nur-line/60 bg-nur-elevated/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Mobil navigatsiya"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    cx(
                      'flex flex-col items-center gap-0.5 rounded-[var(--radius-m)] px-1 py-2 text-[10px] font-medium tracking-wide transition-colors duration-200',
                      isActive ? 'text-nur-ink' : 'text-nur-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cx(
                          'flex h-8 w-8 items-center justify-center rounded-[var(--radius-m)] transition-colors duration-200',
                          isActive && 'bg-nur-sunken text-nur-ink',
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden strokeWidth={isActive ? 2 : 1.75} />
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
