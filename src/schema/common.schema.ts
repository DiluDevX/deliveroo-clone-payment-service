import { z } from 'zod';

export const idRequestPathParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const commonRequestQueryParamsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const emailSchema = z
  .string()
  .min(5, 'Email is too short')
  .max(100, 'Email too long')
  .email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long');
