import { Prisma, Payment, PaymentStatus } from '../../generated/prisma/client.js';
import { isPrismaErrorWithCode, prisma } from '../config/database';
import { PaymentNotFoundError, PaymentAlreadyProcessedError, ConflictError } from '../utils/errors';
import { PRISMA_CODE } from '../utils/constants';

export const createPayment = async (data: Prisma.PaymentCreateInput): Promise<Payment> => {
  try {
    return await prisma.payment.create({ data });
  } catch (error) {
    if (isPrismaErrorWithCode(error, PRISMA_CODE.CONFLICT)) {
      throw new ConflictError('A payment for this order already exists');
    }
    throw error;
  }
};

export const findPaymentById = async (id: string): Promise<Payment | null> => {
  return prisma.payment.findFirst({
    where: { id, deletedAt: null },
  });
};

export const findPaymentByOrderId = async (orderId: string): Promise<Payment | null> => {
  return prisma.payment.findFirst({
    where: { orderId, deletedAt: null },
  });
};

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
  extra?: Prisma.PaymentUpdateInput
): Promise<Payment> => {
  try {
    return await prisma.payment.update({
      where: { id, deletedAt: null },
      data: { status, ...extra },
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, PRISMA_CODE.NOT_FOUND)) {
      throw new PaymentNotFoundError(`Payment with id ${id} not found`);
    }
    throw error;
  }
};

export const setProviderPaymentId = async (
  id: string,
  providerPaymentId: string,
  providerMetadata?: Prisma.InputJsonValue
): Promise<Payment> => {
  try {
    return await prisma.payment.update({
      where: { id, deletedAt: null },
      data: { providerPaymentId, providerMetadata },
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, PRISMA_CODE.NOT_FOUND)) {
      throw new PaymentNotFoundError(`Payment with id ${id} not found`);
    }
    throw error;
  }
};

export const refundPayment = async (id: string, refundReason?: string): Promise<Payment> => {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new PaymentNotFoundError(`Payment with id ${id} not found`);
  }

  if (payment.status === PaymentStatus.REFUNDED) {
    throw new PaymentAlreadyProcessedError('Payment has already been refunded');
  }

  return prisma.payment.update({
    where: { id, deletedAt: null },
    data: {
      status: PaymentStatus.REFUNDED,
      refundedAt: new Date(),
      refundReason: refundReason ?? null,
    },
  });
};

export const softDeletePayment = async (id: string): Promise<Payment> => {
  try {
    return await prisma.payment.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, PRISMA_CODE.NOT_FOUND)) {
      throw new PaymentNotFoundError(`Payment with id ${id} not found`);
    }
    throw error;
  }
};
