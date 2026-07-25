import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authRateLimiter } from '../../shared/middleware/rateLimit.js';
import { validateBody } from '../../shared/middleware/validate.js';
import * as authController from './auth.controller.js';
import {
  loginBodySchema,
  logoutBodySchema,
  passwordResetConfirmBodySchema,
  passwordResetRequestBodySchema,
  refreshBodySchema,
  registerBodySchema,
  updateMeBodySchema,
} from './auth.validation.js';

export const authRouter = Router();
export const usersRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validateBody(registerBodySchema),
  authController.register,
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateBody(loginBodySchema),
  authController.login,
);

authRouter.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshBodySchema),
  authController.refresh,
);

authRouter.post(
  '/logout',
  authenticate,
  validateBody(logoutBodySchema),
  authController.logout,
);

authRouter.post(
  '/password-reset/request',
  authRateLimiter,
  validateBody(passwordResetRequestBodySchema),
  authController.requestPasswordReset,
);

authRouter.post(
  '/password-reset/confirm',
  authRateLimiter,
  validateBody(passwordResetConfirmBodySchema),
  authController.confirmPasswordReset,
);

usersRouter.get('/me', authenticate, authController.getMe);
usersRouter.patch(
  '/me',
  authenticate,
  validateBody(updateMeBodySchema),
  authController.updateMe,
);
