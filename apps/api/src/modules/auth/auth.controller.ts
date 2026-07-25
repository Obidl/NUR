import type { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service.js';
import type {
  LoginBody,
  LogoutBody,
  PasswordResetConfirmBody,
  PasswordResetRequestBody,
  RefreshBody,
  RegisterBody,
  UpdateMeBody,
} from './auth.validation.js';

function sessionMeta(req: Request) {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ip: req.ip,
  };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.registerUser(req.body as RegisterBody, sessionMeta(req));
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.loginUser(req.body as LoginBody, sessionMeta(req));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as RefreshBody;
    const tokens = await authService.refreshSession(body.refreshToken, sessionMeta(req));
    res.status(200).json({ data: { tokens } });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as LogoutBody;
    await authService.logoutUser(req.user!.id, body.refreshToken);
    res.status(200).json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.getMe(req.user!.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.updateMe(req.user!.id, req.body as UpdateMeBody);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.requestPasswordReset(
      req.body as PasswordResetRequestBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function confirmPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.confirmPasswordReset(
      req.body as PasswordResetConfirmBody,
    );
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
