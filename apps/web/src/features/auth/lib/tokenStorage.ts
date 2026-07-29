const ACCESS_KEY = 'nur_access_token';
const REFRESH_KEY = 'nur_refresh_token';
const REMEMBER_KEY = 'nur_remember_session';

export function getRememberSession(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(REMEMBER_KEY) !== '0';
}

export function setRememberSession(remember: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}

function primaryStorage(): Storage {
  return getRememberSession() ? localStorage : sessionStorage;
}

export function readAccessToken(): string | null {
  return (
    sessionStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(ACCESS_KEY)
  );
}

export function readRefreshToken(): string | null {
  return (
    sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_KEY)
  );
}

export function persistAuthTokens(
  accessToken: string | null,
  refreshToken: string | null,
): void {
  // Clear both stores so remember-mode switches don't leave stale tokens.
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);

  if (!accessToken && !refreshToken) return;

  const store = primaryStorage();
  if (accessToken) store.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) store.setItem(REFRESH_KEY, refreshToken);
}
