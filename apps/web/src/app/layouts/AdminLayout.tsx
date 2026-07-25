import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cx } from '@/shared/lib/cx';

export function AdminLayout() {
  const role = useAuthStore((s) => s.user?.role);

  const links = [
    { to: '/admin', label: 'Bosh', end: true },
    { to: '/admin/podcasts', label: 'Podcast' },
    { to: '/admin/books', label: 'Kitob' },
    { to: '/admin/research', label: 'Tadqiqot' },
    { to: '/admin/curriculum', label: 'Yo‘llar' },
    ...(role === 'admin' ? [{ to: '/admin/users', label: 'Users' }] : []),
  ];

  return (
    <div className="min-h-dvh bg-nur-sunken text-nur-ink">
      <div className="border-b border-nur-line bg-nur-elevated px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="font-display text-sm tracking-[0.16em]">NUR Admin</p>
          <nav className="flex flex-wrap gap-3 text-sm text-nur-muted">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cx('hover:text-nur-ink', isActive && 'text-nur-ink')
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/" className="hover:text-nur-ink">
              Ilovaga
            </Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}
