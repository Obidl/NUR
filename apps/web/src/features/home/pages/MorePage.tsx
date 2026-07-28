import { Link } from 'react-router-dom';
import {
  BookMarked,
  Library,
  Route,
  Search,
  Settings,
  BookOpen,
} from 'lucide-react';
import { PageShell } from '@/shared/components/PageShell';
import { useAuthStore } from '@/features/auth/store/authStore';

const links = [
  { to: '/curriculum', label: 'Yo‘llar', hint: 'Kunlik o‘quv yo‘li', icon: Route },
  { to: '/books', label: 'Kitoblar', hint: 'O‘qish', icon: BookOpen },
  { to: '/research', label: 'Tadqiqot', hint: 'Manbali maqolalar', icon: BookMarked },
  { to: '/search', label: 'Qidiruv', hint: 'Barcha kontent', icon: Search },
  { to: '/library', label: 'Kutubxona', hint: 'Davom va sevimlilar', icon: Library },
] as const;

export function MorePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell title="Ko‘proq" description="Boshqa bo‘limlar va shaxsiy joy.">
      <ul className="nur-list">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link to={item.to} className="nur-list-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-white text-nur-accent ring-1 ring-nur-line">
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-[-0.01em]">{item.label}</p>
                  <p className="mt-0.5 text-xs text-nur-muted">{item.hint}</p>
                </div>
              </Link>
            </li>
          );
        })}
        <li>
          <Link to={accessToken ? '/settings' : '/login'} className="nur-list-row">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-white text-nur-accent ring-1 ring-nur-line">
              <Settings size={18} strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-[-0.01em]">
                {accessToken ? 'Profil / Sozlamalar' : 'Kirish'}
              </p>
              <p className="mt-0.5 text-xs text-nur-muted">
                {accessToken ? (user?.email ?? 'Shaxsiy sozlamalar') : 'Hisobingizga kiring'}
              </p>
            </div>
          </Link>
        </li>
      </ul>
    </PageShell>
  );
}
