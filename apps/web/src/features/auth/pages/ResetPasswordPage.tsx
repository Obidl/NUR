import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Field, Input } from '@/shared/components/Field';
import { confirmPasswordReset } from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/components/Toast';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset({ token, newPassword: password });
      toast('Parol yangilandi', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Parol yangilanmadi'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nur-surface px-6 py-8 shadow-[var(--shadow-sm)] md:px-8 md:py-10">
      <p className="font-display text-2xl font-semibold tracking-[0.18em]">NUR</p>
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Yangi parol</h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">Kamida 8 belgi.</p>

      <form className="mt-8 space-y-5" onSubmit={(e) => void onSubmit(e)}>
        {!params.get('token') ? (
          <Field label="Token">
            <Input
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono text-xs"
            />
          </Field>
        ) : null}
        <Field label="Yangi parol">
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? 'Saqlanmoqda…' : 'Parolni yangilash'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-nur-muted">
        <Link to="/login" className="font-medium text-nur-accent hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
