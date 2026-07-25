import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { UserModel } from '../auth/user.model.js';
import { RefreshTokenModel } from '../auth/refreshToken.model.js';
import type { UpdateUserRoleBody, UpdateUserStatusBody } from './admin.validation.js';

function toAdminUser(user: {
  _id: Types.ObjectId;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function adminListUsers(input: {
  page: number;
  limit: number;
  q?: string;
  role?: string;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (input.role) filter.role = input.role;
  if (input.q) {
    const regex = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ email: regex }, { displayName: regex }];
  }

  const skip = (input.page - 1) * input.limit;
  const [rows, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).lean(),
    UserModel.countDocuments(filter),
  ]);

  return {
    items: rows.map(toAdminUser),
    meta: { page: input.page, limit: input.limit, total },
  };
}

export async function adminUpdateUserRole(
  actorId: string,
  userId: string,
  input: UpdateUserRoleBody,
) {
  if (!Types.ObjectId.isValid(userId)) throw new AppError('NOT_FOUND', 'User not found', 404);
  if (actorId === userId && input.role !== 'admin') {
    throw new AppError('VALIDATION_ERROR', 'Cannot demote your own admin role', 422);
  }

  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  user.role = input.role;
  await user.save();
  return toAdminUser(user);
}

export async function adminUpdateUserStatus(
  actorId: string,
  userId: string,
  input: UpdateUserStatusBody,
) {
  if (!Types.ObjectId.isValid(userId)) throw new AppError('NOT_FOUND', 'User not found', 404);
  if (actorId === userId && input.isActive === false) {
    throw new AppError('VALIDATION_ERROR', 'Cannot deactivate your own account', 422);
  }

  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  user.isActive = input.isActive;
  await user.save();

  if (!input.isActive) {
    await RefreshTokenModel.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  return toAdminUser(user);
}
