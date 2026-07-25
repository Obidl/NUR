import { z } from 'zod';
import { Types } from 'mongoose';

export const objectIdSchema = z
  .string()
  .min(1)
  .refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid id' });
