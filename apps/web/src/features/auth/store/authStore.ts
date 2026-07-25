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

const ACCESS_KEY = 'nur_access_token';
const REFRESH_KEY = 'nur_refresh_token';

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

function persistTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  else localStorage.removeItem(ACCESS_KEY);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem(ACCESS_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
  user: null,
  isHydrated: false,
  isLoading: false,

  setTokens: (accessToken, refreshToken) => {
    persistTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  clear: () => {
    persistTokens(null, null);
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
    } catch {
      if (refreshToken) {
        try {
          const tokens = await refreshRequest(refreshToken);
          persistTokens(tokens.accessToken, tokens.refreshToken);
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          const user = await fetchMeRequest();
          set({ user, isHydrated: true });
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
      persistTokens(result.tokens.accessToken, result.tokens.refreshToken);
      const user = await fetchMeRequest();
      set({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (input) => {
    set({ isLoading: true });
    try {
      const result = await loginRequest(input);
      persistTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
      const user = await fetchMeRequest();
      set({ user });
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
