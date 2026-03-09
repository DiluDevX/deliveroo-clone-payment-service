import { z } from 'zod';

export const createItemRequestBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').trim(),
  description: z.string().max(500, 'Description is too long').trim().optional(),
});

export const updateItemRequestBodySchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long').trim().optional(),
    description: z.string().max(500, 'Description is too long').trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
