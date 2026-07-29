import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/shared/components/Button';
import { BrandMark } from '@/shared/components/BrandMark';
import { Field, Input } from '@/shared/components/Field';
import { LoadingOverlay } from '@/shared/components/LoadingScreen';
import { useAuthStore } from '@/features/auth/store/authStore';
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

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    warmApiBackground();
  }, []);

  async function tryRegister(): Promise<void> {
    await register({ displayName, email, password });
    toast('Hisob yaratildi', 'success');
    navigate('/', { replace: true });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await tryRegister();
      return;
    } catch (err) {
      if (!isNetworkError(err)) {
        setError(getErrorMessage(err, 'Ro‘yxatdan o‘tish amalga oshmadi'));
        return;
      }
    }

    setWarming(true);
    try {
      const ready = await waitForApiReady({ deadlineMs: 55_000, delayMs: 2000 });
      if (!ready) {
        setError('Server hali sekin. 20 soniya kutib qayta urinib ko‘ring.');
        return;
      }
      await tryRegister();
    } catch (err) {
      setError(
        isNetworkError(err)
          ? 'Server hali sekin. 20 soniya kutib qayta urinib ko‘ring.'
          : getErrorMessage(err, 'Ro‘yxatdan o‘tish amalga oshmadi'),
      );
    } finally {
      setWarming(false);
    }
  }

  const busy = isLoading || warming;

  return (
    <div className="nur-surface relative overflow-hidden px-6 py-9 md:px-8 md:py-11">
      {busy ? (
        <LoadingOverlay
          message={warming ? 'Server uyg‘onyapti…' : 'Hisob yaratilmoqda…'}
          hint={warming ? 'Bir daqiqadan kam. Sahifani yopmang.' : null}
        />
      ) : null}

      <BrandMark size="md" className="justify-center" />
      <h1 className="mt-6 text-lg font-medium tracking-[-0.02em] text-nur-muted">
        Ro‘yxatdan o‘tish
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">Odatnoma hisobini yarating.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} aria-busy={busy}>
        <Field label="Ism">
          <Input
            type="text"
            name="displayName"
            autoComplete="name"
            required
            minLength={2}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="Parol" hint="Kamida 8 belgi">
          <Input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
          />
        </Field>

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          Ro‘yxatdan o‘tish
        </Button>
      </form>

      <p className="mt-6 text-sm text-nur-muted">
        Allaqachon hisobingiz bormi?{' '}
        <Link to="/login" className="font-medium text-nur-accent hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
