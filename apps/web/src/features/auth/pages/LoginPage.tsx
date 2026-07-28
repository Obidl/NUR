import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Field, Input } from '@/shared/components/Field';
import { LoadingOverlay } from '@/shared/components/LoadingScreen';
import { useAuthStore } from '@/features/auth/store/authStore';
import { warmApi } from '@/services/warmApi';
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
  const [slowHint, setSlowHint] = useState(false);

  const from =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/';

  useEffect(() => {
    warmApi();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setSlowHint(false);
      return;
    }
    const id = window.setTimeout(() => setSlowHint(true), 8000);
    return () => window.clearTimeout(id);
  }, [isLoading]);

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
    <div className="nur-surface relative overflow-hidden px-6 py-9 md:px-8 md:py-11">
      {isLoading ? (
        <LoadingOverlay
          message={slowHint ? 'Server uyg‘onyapti…' : 'Kirish amalga oshirilmoqda…'}
          hint={
            slowHint
              ? 'Birinchi ochilish 20–40 soniya olishi mumkin. Sahifani yopmang.'
              : null
          }
        />
      ) : null}

      <p className="font-display text-2xl font-semibold tracking-[0.2em]">NUR</p>
      <h1 className="mt-6 text-lg font-medium tracking-[-0.02em] text-nur-muted">Kirish</h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">
        Hisobingizga kiring va bugungi yo‘lni davom ettiring.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} aria-busy={isLoading}>
        <Field label="Email">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </Field>

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          Kirish
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
