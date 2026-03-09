import { z } from 'zod';

export const PaymentMethodSchema = z.enum(['CASH_ON_DELIVERY', 'CARD']);

export const CreatePaymentIntentSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  userId: z.string().min(1, 'userId is required'),
  restaurantId: z.string().min(1, 'restaurantId is required'),
  amount: z.number().positive('amount must be positive'),
  currency: z.string().min(1).max(3).default('GBP'),
  paymentMethod: PaymentMethodSchema,
  commissionPercentage: z.number().min(0).max(100),
});

export const PaymentIdParamsSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
});

export const OrderIdParamsSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
});

export const CancelPaymentSchema = z.object({
  refundReason: z.string().min(1, 'refundReason must not be empty').max(500).optional(),
});
