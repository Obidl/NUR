import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { BrandMark } from '@/shared/components/BrandMark';
import { Field, Input } from '@/shared/components/Field';
import { LoadingOverlay } from '@/shared/components/LoadingScreen';
import { useAuthStore } from '@/features/auth/store/authStore';
import { pokeRenderDirect, warmApiBackground } from '@/services/warmApi';
import { getErrorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/components/Toast';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pokeRenderDirect();
    warmApiBackground();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    pokeRenderDirect();

    try {
      await register({ displayName, email, password });
      toast('Hisob yaratildi', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Ro‘yxatdan o‘tish amalga oshmadi'));
    }
  }

  return (
    <div className="nur-surface relative overflow-hidden px-6 py-9 md:px-8 md:py-11">
      {isLoading ? <LoadingOverlay message="Hisob yaratilmoqda…" /> : null}

      <BrandMark size="md" className="justify-center" />
      <h1 className="mt-6 text-lg font-medium tracking-[-0.02em] text-nur-muted">
        Ro‘yxatdan o‘tish
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">Odatnoma hisobini yarating.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} aria-busy={isLoading}>
        <Field label="Ism">
          <Input
            type="text"
            name="displayName"
            autoComplete="name"
            required
            minLength={2}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </Field>

        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
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
