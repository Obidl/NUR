import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

export function AppProviders({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const theme = user?.preferences.theme ?? 'system';
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
      return;
    }

    root.dataset.theme = theme;
  }, [user?.preferences.theme]);

  return children;
}
