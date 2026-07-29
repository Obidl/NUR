import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/shared/components/Button';
import { BrandMark } from '@/shared/components/BrandMark';
import { Field, Input } from '@/shared/components/Field';
import { LoadingOverlay } from '@/shared/components/LoadingScreen';
import { useAuthStore } from '@/features/auth/store/authStore';
import { setRememberSession } from '@/features/auth/lib/tokenStorage';
import { waitForApiReady, warmApiBackground } from '@/services/warmApi';
import { getErrorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/components/Toast';

function isNetworkError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    (err.message === 'Network Error' ||
      err.code === 'ERR_NETWORK' ||
      err.code === 'ECONNABORTED' ||
      err.response?.status === 502 ||
      err.response?.status === 503 ||
      err.response?.status === 504)
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    try {
      return localStorage.getItem('nur_remember_session') !== '0';
    } catch {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [warming, setWarming] = useState(false);

  const from =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/';

  useEffect(() => {
    warmApiBackground();
  }, []);

  async function tryLogin(): Promise<void> {
    setRememberSession(remember);
    await login({ email, password });
    toast('Xush kelibsiz', 'success');
    navigate(from, { replace: true });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await tryLogin();
      return;
    } catch (err) {
      if (!isNetworkError(err)) {
        setError(getErrorMessage(err, 'Kirish amalga oshmadi'));
        return;
      }
    }

    // Cold start: wake via /health only (do NOT spam /login — rate limit).
    setWarming(true);
    try {
      const ready = await waitForApiReady({ deadlineMs: 55_000, delayMs: 2000 });
      if (!ready) {
        setError('Server hali sekin. 20 soniya kutib qayta «Kirish»ni bosing.');
        return;
      }
      await tryLogin();
    } catch (err) {
      setError(
        isNetworkError(err)
          ? 'Server hali sekin. 20 soniya kutib qayta «Kirish»ni bosing.'
          : getErrorMessage(err, 'Kirish amalga oshmadi'),
      );
    } finally {
      setWarming(false);
    }
  }

  const busy = isLoading || warming;

  return (
    <div className="nur-surface relative overflow-hidden px-6 py-9 shadow-[var(--shadow-md)] md:px-8 md:py-11">
      {busy ? (
        <LoadingOverlay
          message={warming ? 'Server uyg‘onyapti…' : 'Kirish amalga oshirilmoqda…'}
          hint={warming ? 'Bir daqiqadan kam. Sahifani yopmang.' : null}
        />
      ) : null}

      <BrandMark size="lg" className="justify-center" />
      <h1 className="mt-7 text-2xl font-semibold tracking-[-0.02em] text-nur-ink">
        Xush kelibsiz
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">
        Hisobingizga kiring va bugungi yo‘lni davom ettiring.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} aria-busy={busy}>
        <Field label="Email">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
            disabled={busy}
          />
        </Field>
        <Field label="Parol">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              invalid={Boolean(error)}
              disabled={busy}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-[var(--radius-s)] p-1.5 text-nur-muted transition-colors hover:text-nur-ink"
              aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              disabled={busy}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-nur-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            disabled={busy}
            className="h-4 w-4 rounded border-nur-line accent-[var(--nur-accent)]"
          />
          Meni eslab qol
        </label>

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
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
