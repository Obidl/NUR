import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/AppError.js';
import {
  generateRefreshTokenValue,
  getRefreshExpiryDate,
  hashToken,
  signAccessToken,
} from './auth.tokens.js';
import { toAuthUser, toPublicUser } from './auth.mapper.js';
import { RefreshTokenModel } from './refreshToken.model.js';
import { PasswordResetTokenModel } from './passwordResetToken.model.js';
import { UserModel } from './user.model.js';
import type {
  AuthSuccessData,
  AuthTokens,
  PublicUser,
} from './auth.types.js';
import type {
  LoginBody,
  PasswordResetConfirmBody,
  PasswordResetRequestBody,
  RegisterBody,
  UpdateMeBody,
} from './auth.validation.js';
import { getEnv } from '../../config/env.js';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000;

type SessionMeta = {
  userAgent?: string;
  ip?: string;
};

async function issueTokenPair(userId: string, role: AuthSuccessData['user']['role'], meta: SessionMeta = {}): Promise<AuthTokens> {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = generateRefreshTokenValue();

  await RefreshTokenModel.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiryDate(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return { accessToken, refreshToken };
}

export async function registerUser(
  input: RegisterBody,
  meta: SessionMeta = {},
): Promise<AuthSuccessData> {
  const email = input.email.toLowerCase().trim();

  const existing = await UserModel.findOne({ email, deletedAt: null });
  if (existing) {
    throw new AppError('CONFLICT', 'An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await UserModel.create({
    email,
    passwordHash,
    displayName: input.displayName.trim(),
    lastLoginAt: new Date(),
  });

  const tokens = await issueTokenPair(user._id.toString(), user.role, meta);

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export async function loginUser(
  input: LoginBody,
  meta: SessionMeta = {},
): Promise<AuthSuccessData> {
  const email = input.email.toLowerCase().trim();

  const user = await UserModel.findOne({ email, deletedAt: null }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
  }

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user._id.toString(), user.role, meta);

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export async function refreshSession(
  refreshToken: string,
  meta: SessionMeta = {},
): Promise<AuthTokens> {
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshTokenModel.findOne({ tokenHash });

  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }

  // Reuse of a revoked refresh token → revoke entire session family for that user.
  if (stored.revokedAt) {
    await RefreshTokenModel.updateMany(
      { userId: stored.userId, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }

  const user = await UserModel.findOne({ _id: stored.userId, deletedAt: null });
  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }

  stored.revokedAt = new Date();
  await stored.save();

  return issueTokenPair(user._id.toString(), user.role, meta);
}

export async function logoutUser(userId: string, refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshTokenModel.findOne({ tokenHash, userId });

  if (stored && !stored.revokedAt) {
    stored.revokedAt = new Date();
    await stored.save();
  }
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'User not found', 401);
  }
  return toPublicUser(user);
}

export async function updateMe(userId: string, input: UpdateMeBody): Promise<PublicUser> {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'User not found', 401);
  }

  if (input.displayName !== undefined) {
    user.displayName = input.displayName;
  }
  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl;
  }
  if (input.preferences) {
    user.preferences = {
      theme: input.preferences.theme ?? user.preferences?.theme ?? 'system',
      quranFontSize:
        input.preferences.quranFontSize ?? user.preferences?.quranFontSize ?? 22,
      reduceMotion:
        input.preferences.reduceMotion ?? user.preferences?.reduceMotion ?? false,
      language: input.preferences.language ?? user.preferences?.language ?? 'uz',
    };
  }

  await user.save();
  return toPublicUser(user);
}

export async function requestPasswordReset(
  input: PasswordResetRequestBody,
): Promise<{ message: string; devResetToken?: string }> {
  const email = input.email.toLowerCase().trim();
  const generic = {
    message: 'If an account exists for this email, a reset link will be available shortly.',
  };

  const user = await UserModel.findOne({ email, deletedAt: null, isActive: true });
  if (!user) {
    return generic;
  }

  // Invalidate previous unused tokens for this user.
  await PasswordResetTokenModel.updateMany(
    { userId: user._id, usedAt: null },
    { usedAt: new Date() },
  );

  const rawToken = generateRefreshTokenValue();
  await PasswordResetTokenModel.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });

  const env = getEnv();
  if (env.NODE_ENV !== 'production') {
    // No email provider in v1 — expose token only outside production for testing.
    console.info(`[auth] password reset token for ${email}: ${rawToken}`);
    return { ...generic, devResetToken: rawToken };
  }

  // Production: wire email provider later; never return the raw token.
  return generic;
}

export async function confirmPasswordReset(input: PasswordResetConfirmBody): Promise<{ success: true }> {
  const tokenHash = hashToken(input.token);
  const stored = await PasswordResetTokenModel.findOne({ tokenHash });

  if (
    !stored ||
    stored.usedAt ||
    stored.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError('VALIDATION_ERROR', 'Invalid or expired reset token', 422);
  }

  const user = await UserModel.findOne({ _id: stored.userId, deletedAt: null }).select(
    '+passwordHash',
  );
  if (!user || !user.isActive) {
    throw new AppError('VALIDATION_ERROR', 'Invalid or expired reset token', 422);
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await user.save();

  stored.usedAt = new Date();
  await stored.save();

  await RefreshTokenModel.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() },
  );

  return { success: true };
}
