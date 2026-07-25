import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateMeRequest } from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/shared/lib/errors';
import type { PublicUser } from '@/features/auth/types/auth.types';
import { useQuranSettingsStore } from '@/features/quran/store/quranSettingsStore';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [theme, setTheme] = useState<PublicUser['preferences']['theme']>(
    user?.preferences.theme ?? 'system',
  );
  const [fontSize, setFontSize] = useState(user?.preferences.quranFontSize ?? 22);
  const [reduceMotion, setReduceMotion] = useState(
    user?.preferences.reduceMotion ?? false,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return null;
  }

  const currentUser = user;
  const isEditor = currentUser.role === 'editor' || currentUser.role === 'admin';

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
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
      setMessage('Saqlandi');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 pb-24 md:px-6 md:pb-12">
      <h1 className="text-2xl font-medium">Profil</h1>
      <p className="mt-2 text-nur-muted">{currentUser.email}</p>

      <div className="mt-8 max-w-md space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Ism</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Mavzu</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as PublicUser['preferences']['theme'])}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2"
          >
            <option value="system">Sistema</option>
            <option value="light">Yorug‘</option>
            <option value="dark">Qorong‘u</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Qur’on shrift o‘lchami: {fontSize}</span>
          <input
            type="range"
            min={16}
            max={40}
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="w-full"
          />
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(event) => setReduceMotion(event.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-nur-muted">Harakatni kamaytirish</span>
        </label>

        {isEditor ? (
          <p className="text-sm">
            <Link to="/admin" className="text-nur-accent">
              Admin panel
            </Link>
          </p>
        ) : null}

        {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--nur-success)]">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void logout()}>
            Chiqish
          </Button>
        </div>
      </div>
    </section>
  );
}
