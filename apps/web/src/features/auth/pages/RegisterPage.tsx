import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/lib/errors';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await register({ displayName, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Ro‘yxatdan o‘tish amalga oshmadi'));
    }
  }

  return (
    <div className="rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated p-6 shadow-sm">
      <p className="font-display text-2xl tracking-[0.18em]">NUR</p>
      <h1 className="mt-4 text-xl font-medium">Ro‘yxatdan o‘tish</h1>
      <p className="mt-2 text-sm text-nur-muted">NUR hisobini yarating.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Ism</span>
          <input
            type="text"
            name="displayName"
            autoComplete="name"
            required
            minLength={2}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
          />
        </label>
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
          <span className="mb-1 block text-nur-muted">Parol (kamida 8 belgi)</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Kutilmoqda…' : 'Ro‘yxatdan o‘tish'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-nur-muted">
        Allaqachon hisobingiz bormi?{' '}
        <Link to="/login" className="text-nur-accent">
          Kirish
        </Link>
      </p>
    </div>
  );
}
