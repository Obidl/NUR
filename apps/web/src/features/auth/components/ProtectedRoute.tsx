import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
