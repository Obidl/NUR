import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/lib/errors';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Kirish amalga oshmadi'));
    }
  }

  return (
    <div className="rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated p-6 shadow-sm">
      <p className="font-display text-2xl tracking-[0.18em]">NUR</p>
      <h1 className="mt-4 text-xl font-medium">Kirish</h1>
      <p className="mt-2 text-sm text-nur-muted">Hisobingizga kiring va davom eting.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Parol</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Kutilmoqda…' : 'Kirish'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-nur-muted">
        <Link to="/forgot-password" className="text-nur-accent">
          Parolni unutdingizmi?
        </Link>
      </p>

      <p className="mt-2 text-sm text-nur-muted">
        Hisobingiz yo‘qmi?{' '}
        <Link to="/register" className="text-nur-accent">
          Ro‘yxatdan o‘tish
        </Link>
      </p>
    </div>
  );
}
