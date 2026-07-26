import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Field, Input } from '@/shared/components/Field';
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
    <PageShell title="Profil" description={currentUser.email} className="pb-24 md:pb-8">
      <div className="nur-surface max-w-md space-y-6 px-5 py-7 md:px-6">
        <Field label="Ism">
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </Field>

        <Field label="Mavzu">
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as PublicUser['preferences']['theme'])}
            className="nur-input"
          >
            <option value="system">Sistema</option>
            <option value="light">Yorug‘</option>
            <option value="dark">Qorong‘u</option>
          </select>
        </Field>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-nur-ink">
            Qur’on shrift o‘lchami: {fontSize}
          </span>
          <input
            type="range"
            min={16}
            max={40}
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="w-full accent-[var(--nur-lamp)]"
          />
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(event) => setReduceMotion(event.target.checked)}
            className="h-4 w-4 rounded border-nur-line accent-[var(--nur-lamp)]"
          />
          <span className="text-nur-muted">Harakatni kamaytirish</span>
        </label>

        {isEditor ? (
          <p className="text-sm">
            <Link to="/admin" className="font-medium text-nur-accent hover:underline">
              Admin panel
            </Link>
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-1">
          <Button type="button" onClick={() => void onSave()} disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void logout()}>
            Chiqish
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
