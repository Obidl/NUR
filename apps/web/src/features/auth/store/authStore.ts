import { create } from 'zustand';
import {
  fetchMeRequest,
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/api/authApi';
import type { PublicUser } from '@/features/auth/types/auth.types';
import {
  persistAuthTokens,
  readAccessToken,
  readRefreshToken,
} from '@/features/auth/lib/tokenStorage';
import { syncLocalPodcastProgressToServer } from '@/features/podcasts/lib/podcastLocalProgress';
import { syncLocalQuranProgressToServer } from '@/features/quran/lib/quranLocalProgress';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: PublicUser | null;
  isHydrated: boolean;
  isLoading: boolean;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  hydrate: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
};

async function afterAuthSuccess() {
  await Promise.all([
    syncLocalQuranProgressToServer(),
    syncLocalPodcastProgressToServer(),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: readAccessToken(),
  refreshToken: readRefreshToken(),
  user: null,
  isHydrated: false,
  isLoading: false,

  setTokens: (accessToken, refreshToken) => {
    persistAuthTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  clear: () => {
    persistAuthTokens(null, null);
    set({ accessToken: null, refreshToken: null, user: null });
  },

  hydrate: async () => {
    const { accessToken, refreshToken, clear } = get();
    if (!accessToken) {
      set({ isHydrated: true, user: null });
      return;
    }

    try {
      const user = await fetchMeRequest();
      set({ user, isHydrated: true });
      void afterAuthSuccess();
    } catch {
      if (refreshToken) {
        try {
          const tokens = await refreshRequest(refreshToken);
          persistAuthTokens(tokens.accessToken, tokens.refreshToken);
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          const user = await fetchMeRequest();
          set({ user, isHydrated: true });
          void afterAuthSuccess();
          return;
        } catch {
          clear();
        }
      } else {
        clear();
      }
      set({ isHydrated: true });
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const result = await registerRequest(input);
      persistAuthTokens(result.tokens.accessToken, result.tokens.refreshToken);
      const user = await fetchMeRequest();
      set({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user,
      });
      await afterAuthSuccess();
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (input) => {
    set({ isLoading: true });
    try {
      const result = await loginRequest(input);
      persistAuthTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
      const user = await fetchMeRequest();
      set({ user });
      await afterAuthSuccess();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const { refreshToken, accessToken, clear } = get();
    try {
      if (accessToken && refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Still clear local session if server logout fails.
    } finally {
      clear();
    }
  },
}));
