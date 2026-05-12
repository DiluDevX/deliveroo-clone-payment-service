import { environment } from '../config/environment';
import { InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PaymentStatus } from '../../generated/prisma/client.js';

interface OrderServiceResponseDTO {
  success: boolean;
  message: string;
}

export const notifyOrderPaymentStatus = async (
  orderId: string,
  paymentId: string,
  paymentStatus: PaymentStatus
): Promise<void> => {
  const response = await fetch(
    `${environment.orderServiceUrl}/v1/orders/${orderId}/payment-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': environment.orderServiceApiKey,
        'x-actor-id': 'payment-service',
        'x-actor-type': 'SYSTEM',
      },
      body: JSON.stringify({ paymentId, paymentStatus }),
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
