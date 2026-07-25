import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { verifyAccessToken } from '../../modules/auth/auth.tokens.js';
import { UserModel } from '../../modules/auth/user.model.js';
import type { RequestUser, UserRole } from '../../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const payload = verifyAccessToken(token);
    const user = await UserModel.findOne({ _id: payload.sub, deletedAt: null });

    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new AppError('FORBIDDEN', 'You do not have permission for this action', 403));
      return;
    }

    next();
  };
}
