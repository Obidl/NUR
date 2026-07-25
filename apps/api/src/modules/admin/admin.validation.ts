import { z } from 'zod';

export const setStatusBodySchema = z.object({
  status: z.enum(['draft', 'in_review', 'archived']),
});

export type SetStatusBody = z.infer<typeof setStatusBodySchema>;

export const adminUsersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['user', 'editor', 'admin']).optional(),
});

export const updateUserRoleBodySchema = z.object({
  role: z.enum(['user', 'editor', 'admin']),
});

export const updateUserStatusBodySchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserRoleBody = z.infer<typeof updateUserRoleBodySchema>;
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusBodySchema>;
