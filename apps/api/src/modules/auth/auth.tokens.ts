import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getEnv } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AccessTokenPayload, UserRole } from './auth.types.js';

export function hashToken(token: string): string {
  const env = getEnv();
  return createHash('sha256')
    .update(`${env.JWT_REFRESH_SECRET}:${token}`)
    .digest('hex');
}

export function generateRefreshTokenValue(): string {
  return randomBytes(48).toString('base64url');
}

export function signAccessToken(userId: string, role: UserRole): string {
  const env = getEnv();
  const payload: AccessTokenPayload = {
    sub: userId,
    role,
    type: 'access',
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const env = getEnv();

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (payload.type !== 'access' || !payload.sub || !payload.role) {
      throw new AppError('UNAUTHORIZED', 'Invalid access token', 401);
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
  }
}

export function getRefreshExpiryDate(): Date {
  const env = getEnv();
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES_IN);

  if (!match) {
    // Fallback 7 days if custom format slips through
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + amount * multipliers[unit]);
}
