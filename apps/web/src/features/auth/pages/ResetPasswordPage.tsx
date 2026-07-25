import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { confirmPasswordReset } from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/shared/lib/errors';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Parol yangilanmadi'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated p-6 shadow-sm">
      <p className="font-display text-2xl tracking-[0.18em]">NUR</p>
      <h1 className="mt-4 text-xl font-medium">Yangi parol</h1>
      <p className="mt-2 text-sm text-nur-muted">Kamida 8 belgi.</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        {!params.get('token') ? (
          <label className="block text-sm">
            <span className="mb-1 block text-nur-muted">Token</span>
            <input
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2 font-mono text-xs"
            />
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Yangi parol</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? 'Saqlanmoqda…' : 'Parolni yangilash'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-nur-muted">
        <Link to="/login" className="text-nur-accent">
          Kirish
        </Link>
      </p>
    </div>
  );
}
