import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

/** Redirects authenticated users away from login/register. */
export function GuestRoute({ children }: PropsWithChildren) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}
