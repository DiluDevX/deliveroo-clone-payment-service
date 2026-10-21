import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { PaymentStatus } from '../../generated/prisma/client.js';

interface OrderServiceResponseDTO {
  success: boolean;
  message: string;
}

export const notifyOrderPaymentStatus = async (
  orderId: string,
  paymentId: string,
  paymentStatus: PaymentStatus
): Promise<void> => {
  const body = JSON.stringify({ paymentId, paymentStatus });
  const token = jwt.sign(
    {
      action: 'payment-status',
      payloadSha256: createHash('sha256').update(body, 'utf8').digest('hex'),
    },
    environment.paymentCallbackSecret,
    {
      algorithm: 'HS256',
      issuer: 'payment-service',
      audience: 'order-service',
      subject: orderId,
      expiresIn: 60,
    }
  );
  const response = await fetch(
    `${environment.orderServiceUrl}/v1/orders/${encodeURIComponent(orderId)}/payment-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': environment.orderServiceApiKey,
        'x-payment-callback-token': token,
        'x-actor-id': 'payment-service',
        'x-actor-type': 'SYSTEM',
      },
      body,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(
      { orderId, paymentId, paymentStatus, status: response.status, errorBody },
      'order service payment status sync failed'
    );
    throw new InternalServerError('Failed to sync order payment status');
  }

  const result = (await response.json()) as OrderServiceResponseDTO;
  logger.info(
    { orderId, paymentId, paymentStatus, message: result.message },
    'order payment synced'
  );
};
