import { z } from 'zod';
import {
  CreatePaymentIntentSchema,
  CancelPaymentSchema,
  PaymentIdParamsSchema,
  OrderIdParamsSchema,
} from '../schema/payment.schema';

export type CreatePaymentIntentDTO = z.infer<typeof CreatePaymentIntentSchema>;
export type CancelPaymentDTO = z.infer<typeof CancelPaymentSchema>;
export type PaymentIdParamsDTO = z.infer<typeof PaymentIdParamsSchema>;
export type OrderIdParamsDTO = z.infer<typeof OrderIdParamsSchema>;

export interface PaymentResponseDTO {
  id: string;
  orderId: string;
  userId: string;
  restaurantId: string;
  amount: number;
  currency: string;
  commissionPercentage: number;
  commissionValue: number;
  transferAmount: number;
  paymentMethod: 'CASH_ON_DELIVERY' | 'CARD';
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  providerPaymentId: string | null;
  refundedAt: Date | null;
  refundReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentIntentResponseDTO {
  paymentId: string;
  status: string;
  clientSecret?: string | null;
}
