import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

/** Redirects authenticated users away from login/register. */
export function GuestRoute({ children }: PropsWithChildren) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isHydrated) {
    return <LoadingScreen message="Hisob tekshirilmoqda…" />;
  }

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}
