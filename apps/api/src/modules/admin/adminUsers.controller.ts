import type { NextFunction, Request, Response } from 'express';
import * as adminUsersService from './adminUsers.service.js';
import type { UpdateUserRoleBody, UpdateUserStatusBody } from './admin.validation.js';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      q?: string;
      role?: string;
    };
    const result = await adminUsersService.adminListUsers(query);
    res.status(200).json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await adminUsersService.adminUpdateUserRole(
      req.user!.id,
      String(params.id),
      req.body as UpdateUserRoleBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (req.validatedParams ?? req.params) as { id: string };
    const data = await adminUsersService.adminUpdateUserStatus(
      req.user!.id,
      String(params.id),
      req.body as UpdateUserStatusBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
