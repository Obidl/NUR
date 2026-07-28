import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isHydrated) {
    return <LoadingScreen message="Hisob tekshirilmoqda…" />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
