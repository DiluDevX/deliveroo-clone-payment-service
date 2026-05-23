import { Prisma, PaymentCustomer, UserPaymentMethod } from '../../generated/prisma/client.js';
import { prisma } from '../config/database';
import { stripe } from '../config/stripe';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';

export const getOrCreatePaymentCustomer = async (userId: string): Promise<PaymentCustomer> => {
  const existingCustomer = await prisma.paymentCustomer.findFirst({
    where: { userId, deletedAt: null },
  });

  if (existingCustomer) {
    return existingCustomer;
  }

  const stripeCustomer = await stripe.customers.create({
    metadata: { userId },
  });

  return prisma.paymentCustomer.create({
    data: {
      userId,
      stripeCustomerId: stripeCustomer.id,
    },
  });
};

export const findPaymentCustomerByUserId = async (
  userId: string
): Promise<PaymentCustomer | null> => {
  return prisma.paymentCustomer.findFirst({
    where: { userId, deletedAt: null },
  });
};

export const listUserPaymentMethods = async (userId: string): Promise<UserPaymentMethod[]> => {
  return prisma.userPaymentMethod.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
};

export const findUserPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<UserPaymentMethod | null> => {
  return prisma.userPaymentMethod.findFirst({
    where: { id: paymentMethodId, userId, deletedAt: null },
  });
};

export const saveStripePaymentMethod = async (
  userId: string,
  customer: PaymentCustomer,
  stripePaymentMethod: {
    id: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
      funding?: string | null;
      country?: string | null;
    };
    billing_details: {
      name?: string | null;
    };
  },
  setAsDefault = false
): Promise<UserPaymentMethod> => {
  const existingMethods = await listUserPaymentMethods(userId);
  const shouldSetDefault = setAsDefault || existingMethods.length === 0;

  if (shouldSetDefault) {
    await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: stripePaymentMethod.id,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    if (shouldSetDefault) {
      await tx.userPaymentMethod.updateMany({
        where: { userId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const data: Prisma.UserPaymentMethodUncheckedCreateInput = {
      userId,
      customerId: customer.id,
      stripePaymentMethodId: stripePaymentMethod.id,
      brand: stripePaymentMethod.card.brand,
      last4: stripePaymentMethod.card.last4,
      expMonth: stripePaymentMethod.card.exp_month,
      expYear: stripePaymentMethod.card.exp_year,
      funding: stripePaymentMethod.card.funding ?? null,
      country: stripePaymentMethod.card.country ?? null,
      cardholderName: stripePaymentMethod.billing_details.name ?? null,
      isDefault: shouldSetDefault,
    };

    return tx.userPaymentMethod.upsert({
      where: { stripePaymentMethodId: stripePaymentMethod.id },
      create: data,
      update: {
        userId,
        customerId: customer.id,
        brand: data.brand,
        last4: data.last4,
        expMonth: data.expMonth,
        expYear: data.expYear,
        funding: data.funding,
        country: data.country,
        cardholderName: data.cardholderName,
        isDefault: shouldSetDefault,
        deletedAt: null,
      },
    });
  });
};

export const setDefaultUserPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<UserPaymentMethod> => {
  const paymentMethod = await findUserPaymentMethod(userId, paymentMethodId);

  if (!paymentMethod) {
    throw new NotFoundError('Payment method not found');
  }

  const customer = await findPaymentCustomerByUserId(userId);

  if (!customer) {
    throw new ConflictError('Payment customer not found for saved payment method');
  }

  await stripe.customers.update(customer.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethod.stripePaymentMethodId,
    },
  });

  return prisma.$transaction(async (tx) => {
    await tx.userPaymentMethod.updateMany({
      where: { userId, deletedAt: null },
      data: { isDefault: false },
    });

    return tx.userPaymentMethod.update({
      where: { id: paymentMethod.id },
      data: { isDefault: true },
    });
  });
};

export const deleteUserPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<UserPaymentMethod> => {
  const paymentMethod = await findUserPaymentMethod(userId, paymentMethodId);

  if (!paymentMethod) {
    throw new NotFoundError('Payment method not found');
  }

  await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

  return prisma.$transaction(async (tx) => {
    const deletedPaymentMethod = await tx.userPaymentMethod.update({
      where: { id: paymentMethod.id },
      data: { deletedAt: new Date(), isDefault: false },
    });

    if (paymentMethod.isDefault) {
      const nextDefault = await tx.userPaymentMethod.findFirst({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (nextDefault) {
        await tx.userPaymentMethod.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return deletedPaymentMethod;
  });
};

export const assertSetupIntentBelongsToCustomer = (
  setupIntentCustomer: string | null,
  customer: PaymentCustomer
): void => {
  if (setupIntentCustomer !== customer.stripeCustomerId) {
    throw new BadRequestError('Setup intent does not belong to the authenticated user');
  }
};
