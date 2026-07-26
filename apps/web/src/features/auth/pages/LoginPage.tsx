import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Field, Input } from '@/shared/components/Field';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/components/Toast';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { toast } = useToast();

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
      toast('Xush kelibsiz', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Kirish amalga oshmadi'));
    }
  }

  return (
    <div className="nur-surface px-6 py-9 md:px-8 md:py-11">
      <p className="font-display text-2xl font-semibold tracking-[0.2em]">NUR</p>
      <h1 className="mt-6 text-lg font-medium tracking-[-0.02em] text-nur-muted">Kirish</h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">
        Hisobingizga kiring va bugungi yo‘lni davom ettiring.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <Field label="Email">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
          />
        </Field>
        <Field label="Parol">
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={Boolean(error)}
          />
        </Field>

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Kutilmoqda…' : 'Kirish'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-nur-muted">
        <Link to="/forgot-password" className="font-medium text-nur-accent hover:underline">
          Parolni unutdingizmi?
        </Link>
      </p>

      <p className="mt-3 text-sm text-nur-muted">
        Hisobingiz yo‘qmi?{' '}
        <Link to="/register" className="font-medium text-nur-accent hover:underline">
          Ro‘yxatdan o‘tish
        </Link>
      </p>
    </div>
  );
}
