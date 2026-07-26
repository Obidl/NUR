import { useEffect, useState } from 'react';
import {
  adminListUsers,
  adminUpdateUserRole,
  adminUpdateUserStatus,
  type AdminUser,
} from '@/features/admin/api/adminApi';
import { Button } from '@/shared/components/Button';
import { getErrorMessage } from '@/shared/lib/errors';

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload(q?: string) {
    const result = await adminListUsers({ q: q || undefined });
    setItems(result.items);
  }

  useEffect(() => {
    void reload().catch((err) => setError(getErrorMessage(err, 'Foydalanuvchilar yuklanmadi')));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload(query);
    } catch (err) {
      setError(getErrorMessage(err, 'Yangilanmadi'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="nur-page-title !text-xl">Foydalanuvchilar</h1>
        <p className="mt-1 text-sm text-nur-muted">Rol va faollik — faqat admin.</p>
      </header>

      {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void reload(query).catch((err) => setError(getErrorMessage(err)));
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Email yoki ism"
          className="flex-1 rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-3 py-2 text-sm"
        />
        <Button type="submit" variant="secondary">
          Qidirish
        </Button>
      </form>

      <ul className="divide-y divide-nur-line">
        {items.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="font-medium">{user.displayName}</p>
              <p className="text-xs text-nur-faint">
                {user.email} · {user.isActive ? 'faol' : 'o‘chirilgan'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={user.role}
                disabled={busy}
                onChange={(e) =>
                  void run(() =>
                    adminUpdateUserRole(user.id, e.target.value as AdminUser['role']).then(
                      () => undefined,
                    ),
                  )
                }
                className="rounded-[var(--radius-s)] border border-nur-line bg-nur-elevated px-2 py-1 text-sm"
              >
                <option value="user">user</option>
                <option value="editor">editor</option>
                <option value="admin">admin</option>
              </select>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    adminUpdateUserStatus(user.id, !user.isActive).then(() => undefined),
                  )
                }
              >
                {user.isActive ? 'O‘chirish' : 'Faollashtirish'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
