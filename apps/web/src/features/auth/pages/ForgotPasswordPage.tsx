import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { BrandMark } from '@/shared/components/BrandMark';
import { Field, Input } from '@/shared/components/Field';
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
        data.devResetToken
          ? 'Dev rejim: quyidagi havola orqali parolni yangilang.'
          : 'Agar shu email bilan hisob bo‘lsa va email xizmati sozlangan bo‘lsa, tiklash havolasi yuboriladi.',
      );
      if (data.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setError(getErrorMessage(err, 'So‘rov amalga oshmadi'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nur-surface px-6 py-9 md:px-8 md:py-11">
      <BrandMark size="md" className="justify-center" />
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Parolni tiklash</h1>
      <p className="mt-2 text-sm leading-relaxed text-nur-muted">Emailingizni kiriting.</p>

      <form className="mt-8 space-y-5" onSubmit={(e) => void onSubmit(e)}>
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {error ? (
          <p className="text-sm text-[var(--nur-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="text-sm text-nur-muted">{message}</p> : null}
        {devToken ? (
          <p className="break-all text-xs text-nur-faint">
            Dev token:{' '}
            <Link
              className="font-medium text-nur-accent hover:underline"
              to={`/reset-password?token=${encodeURIComponent(devToken)}`}
            >
              tiklash sahifasi
            </Link>
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Yuborilmoqda…' : 'Davom etish'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-nur-muted">
        <Link to="/login" className="font-medium text-nur-accent hover:underline">
          Kirishga qaytish
        </Link>
      </p>
    </div>
  );
}
