import { http } from '@/services/http';
import { endpoints } from '@/services/endpoints';
import type {
  AuthSuccessResponse,
  AuthTokens,
  MeResponse,
  PublicUser,
} from '@/features/auth/types/auth.types';

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export async function registerRequest(input: RegisterInput) {
  const { data } = await http.post<AuthSuccessResponse>(endpoints.auth.register, input);
  return data.data;
}

export async function loginRequest(input: LoginInput) {
  const { data } = await http.post<AuthSuccessResponse>(endpoints.auth.login, input);
  return data.data;
}

export async function refreshRequest(refreshToken: string) {
  const { data } = await http.post<{ data: { tokens: AuthTokens } }>(endpoints.auth.refresh, {
    refreshToken,
  });
  return data.data.tokens;
}

export async function logoutRequest(refreshToken: string) {
  await http.post(endpoints.auth.logout, { refreshToken });
}

export async function fetchMeRequest(): Promise<PublicUser> {
  const { data } = await http.get<MeResponse>(endpoints.me);
  return data.data;
}

export async function updateMeRequest(
  input: Partial<Pick<PublicUser, 'displayName' | 'avatarUrl' | 'preferences'>>,
): Promise<PublicUser> {
  const { data } = await http.patch<MeResponse>(endpoints.me, input);
  return data.data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await http.post<{ data: { message: string; devResetToken?: string } }>(
    endpoints.auth.passwordResetRequest,
    { email },
  );
  return data.data;
}

export async function confirmPasswordReset(input: { token: string; newPassword: string }) {
  const { data } = await http.post<{ data: { success: boolean } }>(
    endpoints.auth.passwordResetConfirm,
    input,
  );
  return data.data;
}
