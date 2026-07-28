import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { UserRole } from '@/features/auth/types/auth.types';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

type RoleRouteProps = PropsWithChildren<{
  roles: UserRole[];
}>;

export function RoleRoute({ children, roles }: RoleRouteProps) {
  const location = useLocation();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return <LoadingScreen message="Hisob tekshirilmoqda…" />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
