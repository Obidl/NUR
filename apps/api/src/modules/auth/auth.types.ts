export type UserRole = 'user' | 'editor' | 'admin';

export type UserPreferences = {
  theme: 'system' | 'light' | 'dark';
  quranFontSize: number;
  reduceMotion: boolean;
  language: 'uz';
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  preferences: UserPreferences;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSuccessData = {
  user: Pick<PublicUser, 'id' | 'email' | 'displayName' | 'role'>;
  tokens: AuthTokens;
};

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  type: 'access';
};

export type RequestUser = {
  id: string;
  role: UserRole;
  email: string;
};
