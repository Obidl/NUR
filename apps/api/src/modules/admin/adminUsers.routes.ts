import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.js';
import * as adminUsersController from './adminUsers.controller.js';
import { objectIdSchema } from '../../shared/validation/objectId.js';
import {
  adminUsersListQuerySchema,
  updateUserRoleBodySchema,
  updateUserStatusBodySchema,
} from './admin.validation.js';

export const adminUsersRouter = Router();

const adminGuard = [authenticate, authorize('admin')] as const;

adminUsersRouter.get(
  '/',
  ...adminGuard,
  validateQuery(adminUsersListQuerySchema),
  adminUsersController.listUsers,
);

adminUsersRouter.patch(
  '/:id/role',
  ...adminGuard,
  validateParams(z.object({ id: objectIdSchema })),
  validateBody(updateUserRoleBodySchema),
  adminUsersController.updateRole,
);

adminUsersRouter.patch(
  '/:id/status',
  ...adminGuard,
  validateParams(z.object({ id: objectIdSchema })),
  validateBody(updateUserStatusBodySchema),
  adminUsersController.updateStatus,
);
