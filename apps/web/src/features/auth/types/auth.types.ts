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

export type AuthUserSummary = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSuccessResponse = {
  data: {
    user: AuthUserSummary;
    tokens: AuthTokens;
  };
};

export type MeResponse = {
  data: PublicUser;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
};
