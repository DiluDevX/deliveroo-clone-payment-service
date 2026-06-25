import { z } from 'zod';
import {
  CreatePaymentIntentSchema,
  CancelPaymentSchema,
  FinalizeSetupIntentSchema,
  PaymentIdParamsSchema,
  PaymentMethodIdParamsSchema,
  OrderIdParamsSchema,
} from '../schema/payment.schema';

export type CreatePaymentIntentDTO = z.infer<typeof CreatePaymentIntentSchema>;
export type CancelPaymentDTO = z.infer<typeof CancelPaymentSchema>;
export type FinalizeSetupIntentDTO = z.infer<typeof FinalizeSetupIntentSchema>;
export type PaymentIdParamsDTO = z.infer<typeof PaymentIdParamsSchema>;
export type PaymentMethodIdParamsDTO = z.infer<typeof PaymentMethodIdParamsSchema>;
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
  providerMetadata?: unknown;
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

export interface SetupIntentResponseDTO {
  setupIntentId: string;
  clientSecret: string;
}

export interface UserPaymentMethodResponseDTO {
  id: string;
  providerPaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  funding: string | null;
  country: string | null;
  cardholderName: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
