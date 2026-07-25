import { z } from 'zod';

export const registerBodySchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(80, 'Display name is too long'),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const passwordResetRequestBodySchema = z.object({
  email: z.string().trim().email('Invalid email'),
});

export const passwordResetConfirmBodySchema = z.object({
  token: z.string().min(20, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const updateMeBodySchema = z
  .object({
    displayName: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    preferences: z
      .object({
        theme: z.enum(['system', 'light', 'dark']).optional(),
        quranFontSize: z.number().int().min(16).max(40).optional(),
        reduceMotion: z.boolean().optional(),
        language: z.literal('uz').optional(),
      })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type PasswordResetRequestBody = z.infer<typeof passwordResetRequestBodySchema>;
export type PasswordResetConfirmBody = z.infer<typeof passwordResetConfirmBodySchema>;
export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;
