import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { requestPasswordReset } from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/shared/lib/errors';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevToken(null);
    try {
      const data = await requestPasswordReset(email);
      setMessage(
        'Agar shu email bilan hisob bo‘lsa, tiklash ko‘rsatmasi tayyor. Email xizmati keyinroq ulanadi.',
      );
      if (data.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setError(getErrorMessage(err, 'So‘rov amalga oshmadi'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-l)] border border-nur-line bg-nur-elevated p-6 shadow-sm">
      <p className="font-display text-2xl tracking-[0.18em]">NUR</p>
      <h1 className="mt-4 text-xl font-medium">Parolni tiklash</h1>
      <p className="mt-2 text-sm text-nur-muted">Emailingizni kiriting.</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block text-sm">
          <span className="mb-1 block text-nur-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[var(--radius-s)] border border-nur-line bg-nur-bg px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-[var(--nur-danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-nur-muted">{message}</p> : null}
        {devToken ? (
          <p className="break-all text-xs text-nur-faint">
            Dev token:{' '}
            <Link className="text-nur-accent" to={`/reset-password?token=${encodeURIComponent(devToken)}`}>
              tiklash sahifasi
            </Link>
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Yuborilmoqda…' : 'Davom etish'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-nur-muted">
        <Link to="/login" className="text-nur-accent">
          Kirishga qaytish
        </Link>
      </p>
    </div>
  );
}
