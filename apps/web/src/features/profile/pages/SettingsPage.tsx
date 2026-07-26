import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Field';
import { PageShell } from '@/shared/components/PageShell';
import { useToast } from '@/shared/components/Toast';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateMeRequest } from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/shared/lib/errors';
import type { PublicUser } from '@/features/auth/types/auth.types';
import { useQuranSettingsStore } from '@/features/quran/store/quranSettingsStore';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [theme, setTheme] = useState<PublicUser['preferences']['theme']>(
    user?.preferences.theme ?? 'system',
  );
  const [fontSize, setFontSize] = useState(user?.preferences.quranFontSize ?? 22);
  const [reduceMotion, setReduceMotion] = useState(
    user?.preferences.reduceMotion ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return null;
  }

  const currentUser = user;
  const isEditor = currentUser.role === 'editor' || currentUser.role === 'admin';
  const initial = currentUser.displayName?.charAt(0)?.toUpperCase() || 'N';

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMeRequest({
        displayName,
        preferences: {
          theme,
          quranFontSize: fontSize,
          reduceMotion,
          language: 'uz',
        },
      });
      useAuthStore.setState({ user: updated });
      useQuranSettingsStore.getState().hydrateFromUserPreference(updated.preferences.quranFontSize);
      toast('Sozlamalar saqlandi', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Profil" className="pb-24 md:pb-8">
      <div className="mb-8 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-nur-accent font-display text-xl text-[var(--nur-accent-ink)]"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-medium">{currentUser.displayName}</p>
          <p className="truncate text-sm text-nur-muted">{currentUser.email}</p>
        </div>
      </div>

      <div className="nur-list max-w-md overflow-hidden">
        <div className="nur-list-row !items-start flex-col gap-2 sm:flex-row sm:!items-center">
          <div className="min-w-[7rem] shrink-0">
            <p className="text-sm font-medium text-nur-ink">Ism</p>
          </div>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="!bg-white"
          />
        </div>

        <div className="nur-list-row !items-start flex-col gap-2 sm:flex-row sm:!items-center">
          <div className="min-w-[7rem] shrink-0">
            <p className="text-sm font-medium text-nur-ink">Mavzu</p>
          </div>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as PublicUser['preferences']['theme'])}
            className="nur-input !bg-white"
          >
            <option value="system">Sistema</option>
            <option value="light">Yorug‘</option>
            <option value="dark">Qorong‘u</option>
          </select>
        </div>

        <div className="nur-list-row !items-start flex-col gap-3">
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-sm font-medium text-nur-ink">Qur’on shrifti</p>
            <span className="text-xs tabular-nums text-nur-muted">{fontSize}px</span>
          </div>
          <input
            type="range"
            min={16}
            max={40}
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="w-full accent-[var(--nur-accent)]"
          />
          <p
            className="nur-sacred w-full text-center font-quran text-[var(--nur-quran-ink)]"
            dir="rtl"
            lang="ar"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.9 }}
          >
            بِسْمِ ٱللَّهِ
          </p>
        </div>

        <label className="nur-list-row cursor-pointer">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-nur-ink">Harakatni kamaytirish</p>
            <p className="mt-0.5 text-xs text-nur-muted">Animatsiyalarni sekinlashtirish</p>
          </div>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(event) => setReduceMotion(event.target.checked)}
            className="h-5 w-5 rounded border-nur-line accent-[var(--nur-accent)]"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[var(--nur-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex max-w-md flex-col gap-3">
        <Button type="button" className="w-full" onClick={() => void onSave()} disabled={saving}>
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>
          Chiqish
        </Button>
      </div>

      {isEditor ? (
        <p className="mt-8 text-center text-xs text-nur-faint">
          <Link to="/admin" className="hover:text-nur-muted">
            Admin panel
          </Link>
        </p>
      ) : null}
    </PageShell>
  );
}
