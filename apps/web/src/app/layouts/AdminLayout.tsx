import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cx } from '@/shared/lib/cx';

export function AdminLayout() {
  const role = useAuthStore((s) => s.user?.role);

  const links = [
    { to: '/admin', label: 'Bosh', end: true },
    { to: '/admin/videos', label: 'Video' },
    { to: '/admin/podcasts', label: 'Podcast' },
    { to: '/admin/books', label: 'Kitob' },
    { to: '/admin/research', label: 'Tadqiqot' },
    { to: '/admin/curriculum', label: 'Yo‘llar' },
    ...(role === 'admin' ? [{ to: '/admin/users', label: 'Users' }] : []),
  ];

  return (
    <div className="min-h-dvh bg-nur-bg text-nur-ink">
      <header className="sticky top-0 z-30 border-b border-nur-line/50 bg-nur-elevated/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          <p className="font-display text-sm font-semibold tracking-[0.18em]">NUR Admin</p>
          <nav className="flex flex-wrap items-center gap-0.5 text-sm text-nur-muted">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cx(
                    'rounded-[var(--radius-m)] px-3 py-2 transition-colors duration-200',
                    isActive
                      ? 'bg-nur-sunken/80 font-medium text-nur-ink'
                      : 'hover:bg-nur-sunken/50 hover:text-nur-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/"
              className="ml-1 rounded-[var(--radius-m)] px-3 py-2 text-nur-accent transition-colors hover:bg-nur-accent-soft"
            >
              Ilovaga
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </div>
    </div>
  );
}
