import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Library, Mic2, ScrollText, Search } from 'lucide-react';
import { cx } from '@/shared/lib/cx';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PodcastPlayerBar } from '@/features/podcasts/components/PodcastPlayerBar';

const desktopNav = [
  { to: '/', label: 'Bugun', end: true },
  { to: '/quran', label: 'Qur’on' },
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
  { to: '/podcasts', label: 'Audio', icon: Mic2 },
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-s)] focus:bg-nur-lamp focus:px-3 focus:py-2 focus:text-nur-lamp-ink"
      >
        Asosiy kontentga o‘tish
      </a>

      <header className="sticky top-0 z-30 border-b border-nur-line/80 bg-nur-elevated/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <NavLink
            to="/"
            className="font-display text-xl tracking-[0.18em] text-nur-ink"
            aria-label="NUR bosh sahifa"
          >
            NUR
          </NavLink>

          <nav
            className="hidden flex-wrap items-center gap-1 text-sm md:flex"
            aria-label="Asosiy navigatsiya"
          >
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cx(
                    'rounded-[var(--radius-s)] px-3 py-2 text-nur-muted transition-colors',
                    isActive && 'bg-nur-sunken text-nur-ink',
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
                    'rounded-[var(--radius-s)] px-3 py-2 text-nur-muted transition-colors',
                    isActive && 'bg-nur-sunken text-nur-ink',
                  )
                }
              >
                {user?.displayName ?? 'Profil'}
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="rounded-[var(--radius-s)] px-3 py-2 text-nur-accent"
              >
                Kirish
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <NavLink to="/curriculum" className="text-sm text-nur-muted">
              Yo‘llar
            </NavLink>
            <NavLink to="/research" className="text-sm text-nur-muted">
              Tadqiqot
            </NavLink>
            {accessToken ? (
              <NavLink to="/settings" className="text-sm text-nur-muted">
                Profil
              </NavLink>
            ) : (
              <NavLink to="/login" className="text-sm text-nur-accent">
                Kirish
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <PodcastPlayerBar />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-nur-line bg-nur-elevated/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Mobil navigatsiya"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    cx(
                      'flex flex-col items-center gap-1 px-1 py-2 text-[10px] text-nur-muted',
                      isActive && 'text-nur-ink',
                    )
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
