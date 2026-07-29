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
import { waitForApiReady, warmApi } from '@/services/warmApi';
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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    try {
      return localStorage.getItem('nur_remember_session') !== '0';
    } catch {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [slowHint, setSlowHint] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [warmAttempt, setWarmAttempt] = useState(0);
  const [warmMax, setWarmMax] = useState(24);

  const from =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/';

  useEffect(() => {
    const controller = new AbortController();
    void waitForApiReady({
      signal: controller.signal,
      onProgress: ({ attempt, maxAttempts, ready }) => {
        setWarmAttempt(attempt);
        setWarmMax(maxAttempts);
        if (ready) setApiReady(true);
      },
    }).then((ok) => {
      if (!controller.signal.aborted) setApiReady(ok);
    });
    return () => controller.abort();
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

    if (!apiReady) {
      const ok = await warmApi();
      if (!ok) {
        setError('Server hali tayyor emas. 20 soniya kutib qayta urinib ko‘ring.');
        return;
      }
      setApiReady(true);
    }

    try {
      setRememberSession(remember);
      await login({ email, password });
      toast('Xush kelibsiz', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const isNetwork =
        axios.isAxiosError(err) &&
        (err.message === 'Network Error' ||
          err.code === 'ERR_NETWORK' ||
          err.code === 'ECONNABORTED' ||
          err.response?.status === 502 ||
          err.response?.status === 503 ||
          err.response?.status === 504);

      if (isNetwork) {
        setApiReady(false);
        const warmed = await waitForApiReady({
          maxAttempts: 12,
          delayMs: 2500,
          onProgress: ({ attempt, maxAttempts, ready }) => {
            setWarmAttempt(attempt);
            setWarmMax(maxAttempts);
            if (ready) setApiReady(true);
          },
        });
        if (!warmed) {
          setError(
            'Server uyg‘onmadi. 1 daqiqa kutib sahifani yangilang, keyin qayta «Kirish».',
          );
          return;
        }
        try {
          setRememberSession(remember);
          await login({ email, password });
          toast('Xush kelibsiz', 'success');
          navigate(from, { replace: true });
          return;
        } catch (retryErr) {
          setError(getErrorMessage(retryErr, 'Kirish amalga oshmadi'));
          return;
        }
      }
      setError(getErrorMessage(err, 'Kirish amalga oshmadi'));
    }
  }

  const formDisabled = isLoading || !apiReady;

  return (
    <div className="nur-surface relative overflow-hidden px-6 py-9 shadow-[var(--shadow-md)] md:px-8 md:py-11">
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

      {!apiReady && !isLoading ? (
        <LoadingOverlay
          message="Server tayyorlanmoqda…"
          hint={`Uyg‘onish ${warmAttempt}/${warmMax}. Bu 20–50 soniya olishi mumkin.`}
        />
      ) : null}

      <BrandMark to={undefined} size="lg" className="justify-center" />
      <h1 className="mt-7 text-2xl font-semibold tracking-[-0.02em] text-nur-ink">
        Xush kelibsiz
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">
        Hisobingizga kiring va bugungi yo‘lni davom ettiring.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} aria-busy={formDisabled}>
        <Field label="Email">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
            disabled={formDisabled}
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
              disabled={formDisabled}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-[var(--radius-s)] p-1.5 text-nur-muted transition-colors hover:text-nur-ink"
              aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              disabled={formDisabled}
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
            disabled={formDisabled}
            className="h-4 w-4 rounded border-nur-line accent-[var(--nur-accent)]"
          />
          Meni eslab qol
        </label>

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={formDisabled}>
          {apiReady ? 'Kirish' : 'Kutilmoqda…'}
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
