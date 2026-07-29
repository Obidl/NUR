import { Link } from 'react-router-dom';
import {
  BookMarked,
  BookOpen,
  Library,
  Route,
  Search,
  Settings,
} from 'lucide-react';
import { PageShell } from '@/shared/components/PageShell';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCommandPaletteStore } from '@/features/shell/store/commandPaletteStore';
import { AddToHomeScreenCard } from '@/features/home/components/AddToHomeScreenCard';

const links = [
  { to: '/curriculum', label: 'Yo‘llar', hint: 'Kunlik o‘quv yo‘li', icon: Route },
  { to: '/books', label: 'Kitoblar', hint: 'O‘qish', icon: BookOpen },
  { to: '/research', label: 'Tadqiqot', hint: 'Manbali maqolalar', icon: BookMarked },
  { to: '/library', label: 'Kutubxona', hint: 'Davom va sevimlilar', icon: Library },
  { to: '/search', label: 'Qidiruv', hint: 'To‘liq qidiruv sahifasi', icon: Search },
] as const;

export function MorePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const openPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <PageShell title="Ko‘proq" description="Boshqa bo‘limlar va shaxsiy joy.">
      <AddToHomeScreenCard />
      <button
        type="button"
        onClick={() => openPalette(true)}
        className="nur-list-row mb-6 w-full border border-nur-line bg-nur-elevated"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-sunken text-nur-accent">
          <Search size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold tracking-[-0.01em]">Tezkor qidiruv</p>
          <p className="mt-0.5 text-xs text-nur-muted">Sahifa va kontent · ⌘K</p>
        </div>
        <kbd className="hidden shrink-0 rounded bg-nur-sunken px-2 py-1 text-[10px] font-medium text-nur-faint sm:inline">
          ⌘K
        </kbd>
      </button>

      <ul className="nur-list">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link to={item.to} className="nur-list-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-elevated text-nur-accent ring-1 ring-nur-line">
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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-elevated text-nur-accent ring-1 ring-nur-line">
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
