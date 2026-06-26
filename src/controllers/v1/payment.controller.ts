import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as paymentService from '../../services/payment.database.service';
import * as paymentMethodService from '../../services/payment-method.database.service';
import { logger } from '../../utils/logger';
import {
  BadRequestError,
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
  PaymentNotSucceededError,
  ConflictError,
  ForbiddenError,
} from '../../utils/errors';
import { stripe } from '../../config/stripe';
import { environment } from '../../config/environment';
import * as orderService from '../../services/order.service';
import { publishEvent } from '../../messaging/event-publisher';
import { CommonResponseDTO } from '../../dtos/common.dto';
import {
  CreatePaymentIntentDTO,
  CancelPaymentDTO,
  PaymentIdParamsDTO,
  OrderIdParamsDTO,
  PaymentResponseDTO,
  CreatePaymentIntentResponseDTO,
  FinalizeSetupIntentDTO,
  SetupIntentResponseDTO,
  UserPaymentMethodResponseDTO,
  PaymentMethodIdParamsDTO,
} from '../../dtos/payment.dto';
import {
  PaymentStatus,
  PaymentMethod,
  UserPaymentMethod,
} from '../../../generated/prisma/client.js';
import Stripe from 'stripe';
import { PaymentEventData } from '../../types/event-envelope';

type StripeExpandableId = string | { id: string } | null;

const getAuthenticatedUserId = (req: { actor?: { userId?: string } }): string => {
  const userId = req.actor?.userId;

  if (!userId) {
    throw new ForbiddenError('Authenticated user context is required');
  }

  return userId;
};

const getExpandableId = (value: StripeExpandableId): string | null => {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.id;
};

const toUserPaymentMethodResponse = (
  paymentMethod: UserPaymentMethod
): UserPaymentMethodResponseDTO => ({
  id: paymentMethod.id,
  providerPaymentMethodId: paymentMethod.stripePaymentMethodId,
  brand: paymentMethod.brand,
  last4: paymentMethod.last4,
  expMonth: paymentMethod.expMonth,
  expYear: paymentMethod.expYear,
  funding: paymentMethod.funding,
  country: paymentMethod.country,
  cardholderName: paymentMethod.cardholderName,
  isDefault: paymentMethod.isDefault,
  createdAt: paymentMethod.createdAt,
  updatedAt: paymentMethod.updatedAt,
});

const getMetadataString = (metadata: unknown, key: string): string | undefined => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];

  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const notifyOrderPaymentStatus = async (
  orderId: string,
  paymentId: string,
  paymentStatus: PaymentStatus
): Promise<void> => {
  await orderService.notifyOrderPaymentStatus(orderId, paymentId, paymentStatus);
};

const getPaymentEventType = (paymentStatus: PaymentStatus): string | null => {
  switch (paymentStatus) {
    case PaymentStatus.SUCCEEDED:
      return 'payment.succeeded';
    case PaymentStatus.FAILED:
      return 'payment.failed';
    case PaymentStatus.CANCELLED:
      return 'payment.canceled';
    case PaymentStatus.REFUNDED:
      return 'payment.refunded';
    default:
      return null;
  }
};

const toPaymentEventData = (payment: PaymentResponseDTO): PaymentEventData => ({
  paymentId: payment.id,
  orderId: payment.orderId,
  userId: payment.userId,
  userEmail: getMetadataString(payment.providerMetadata, 'userEmail'),
  userFirstName: getMetadataString(payment.providerMetadata, 'userFirstName'),
  userLastName: getMetadataString(payment.providerMetadata, 'userLastName'),
  restaurantId: payment.restaurantId,
  amount: payment.amount,
  currency: payment.currency,
  paymentMethod: payment.paymentMethod,
  status: payment.status,
  provider: payment.paymentMethod === PaymentMethod.CARD ? 'stripe' : 'cash_on_delivery',
  providerPaymentId: payment.providerPaymentId,
  providerPaymentIntentId: payment.providerPaymentId,
  ...(payment.status === PaymentStatus.SUCCEEDED
    ? { paidAt: payment.updatedAt.toISOString() }
    : {}),
});

const publishPaymentStatusEvent = async (payment: PaymentResponseDTO): Promise<void> => {
  const eventType = getPaymentEventType(payment.status);

  if (!eventType) {
    return;
  }

  try {
    await publishEvent(eventType, toPaymentEventData(payment));
  } catch (error) {
    logger.error(
      { error, paymentId: payment.id, orderId: payment.orderId, eventType },
      'Failed to publish payment event'
    );
  }
};

const syncPaymentAndOrderStatus = async (
  paymentId: string,
  paymentStatus: PaymentStatus
): Promise<PaymentResponseDTO> => {
  const updated = await paymentService.updatePaymentStatus(paymentId, paymentStatus);
  await notifyOrderPaymentStatus(updated.orderId, updated.id, paymentStatus);
  await publishPaymentStatusEvent(updated);
  return updated;
};

const getPaymentStatusForStripeEvent = (eventType: string): PaymentStatus | null => {
  switch (eventType) {
    case 'payment_intent.succeeded':
      return PaymentStatus.SUCCEEDED;
    case 'payment_intent.payment_failed':
      return PaymentStatus.FAILED;
    case 'payment_intent.canceled':
      return PaymentStatus.CANCELLED;
    default:
      return null;
  }
};

export const createPaymentIntent = async (
  req: Request<unknown, CommonResponseDTO<CreatePaymentIntentResponseDTO>, CreatePaymentIntentDTO>,
  res: Response<CommonResponseDTO<CreatePaymentIntentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      orderId,
      userId,
      userEmail,
      userFirstName,
      userLastName,
      restaurantId,
      amount,
      currency,
      paymentMethod,
      commissionPercentage,
    } = req.body;

    const commissionValue = (amount * commissionPercentage) / 100;
    const transferAmount = amount - commissionValue;
    const notificationMetadata = {
      orderId,
      userId,
      userEmail,
      userFirstName,
      userLastName,
      restaurantId,
    };

    // Create Stripe PaymentIntent first (for CARD), then DB record.
    // If createPayment or setProviderPaymentId fails, the PaymentIntent exists in Stripe but is
    // not linked in our DB; retries are safe due to stable idempotencyKey (orderId) which ensures
    // the same PaymentIntent is returned on retry, preventing duplicate intents.
    if (paymentMethod === PaymentMethod.CARD) {
      const customer = await paymentMethodService.getOrCreatePaymentCustomer(userId);
      const existingPayment = await paymentService.findPaymentByOrderId(orderId);
      if (existingPayment) {
        if (
          existingPayment.paymentMethod !== PaymentMethod.CARD ||
          !existingPayment.providerPaymentId
        ) {
          throw new PaymentAlreadyProcessedError(
            'A non-card payment already exists for this order'
          );
        }

        if (existingPayment.amount !== amount || existingPayment.currency !== currency) {
          throw new ConflictError('Existing payment intent does not match the current order total');
        }

        const existingStripeIntent = await stripe.paymentIntents.retrieve(
          existingPayment.providerPaymentId
        );

        if (existingStripeIntent.status === 'succeeded') {
          throw new PaymentAlreadyProcessedError('Payment has already succeeded for this order');
        }

        res.status(StatusCodes.OK).json({
          success: true,
          message: 'Existing payment intent retrieved',
          data: {
            paymentId: existingPayment.id,
            status: existingPayment.status,
            clientSecret: existingStripeIntent.client_secret,
          },
        });
        return;
      }

      // Create real Stripe PaymentIntent with full amount (in minor units)
      const stripeIntent = await stripe.paymentIntents.create(
        {
          amount, // Amount already in minor units (pennies/cents)
          currency: currency.toLowerCase(),
          customer: customer.stripeCustomerId,
          payment_method_types: ['card'],
          metadata: {
            orderId,
            userId,
            ...(userEmail ? { userEmail } : {}),
            ...(userFirstName ? { userFirstName } : {}),
            ...(userLastName ? { userLastName } : {}),
            restaurantId,
          },
        },
        { idempotencyKey: orderId }
      );

      // Now create DB payment record
      const payment = await paymentService.createPayment({
        orderId,
        userId,
        restaurantId,
        amount,
        currency,
        commissionPercentage,
        commissionValue,
        transferAmount,
        paymentMethod: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
      });

      // Store Stripe PaymentIntent ID and metadata in database
      const updatedPayment = await paymentService.setProviderPaymentId(
        payment.id,
        stripeIntent.id,
        notificationMetadata
      );

      logger.info(
        { paymentId: payment.id, stripePaymentIntentId: stripeIntent.id, orderId },
        'Stripe PaymentIntent created'
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Payment intent created',
        data: {
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
          clientSecret: stripeIntent.client_secret,
        },
      });
      return;
    }

    // CASH_ON_DELIVERY: create DB payment record
    const payment = await paymentService.createPayment({
      orderId,
      userId,
      restaurantId,
      amount,
      currency,
      commissionPercentage,
      commissionValue,
      transferAmount,
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      status: PaymentStatus.PENDING,
      providerMetadata: notificationMetadata,
    });

    logger.info({ paymentId: payment.id, orderId, paymentMethod }, 'Payment created');

    // Set status to PROCESSING for cash on delivery
    const updated = await paymentService.updatePaymentStatus(payment.id, PaymentStatus.PROCESSING);

    logger.info({ paymentId: payment.id }, 'Payment status set to PROCESSING (cash on delivery)');

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Payment intent created',
      data: {
        paymentId: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    logger.error(error, 'create payment intent error');
    next(error);
  }
};

export const createSetupIntent = async (
  req: Request<unknown, CommonResponseDTO<SetupIntentResponseDTO>>,
  res: Response<CommonResponseDTO<SetupIntentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const customer = await paymentMethodService.getOrCreatePaymentCustomer(userId);

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { userId },
    });

    if (!setupIntent.client_secret) {
      throw new BadRequestError('Setup intent client secret unavailable');
    }

    logger.info({ userId, setupIntentId: setupIntent.id }, 'Stripe SetupIntent created');

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Setup intent created',
      data: {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret,
      },
    });
  } catch (error) {
    logger.error(error, 'create setup intent error');
    next(error);
  }
};

export const finalizeSetupIntent = async (
  req: Request<unknown, CommonResponseDTO<UserPaymentMethodResponseDTO>, FinalizeSetupIntentDTO>,
  res: Response<CommonResponseDTO<UserPaymentMethodResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { setupIntentId, setAsDefault } = req.body;
    const customer = await paymentMethodService.getOrCreatePaymentCustomer(userId);
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
      expand: ['payment_method'],
    });

    if (setupIntent.status !== 'succeeded') {
      throw new BadRequestError(`Setup intent is not complete. Status: ${setupIntent.status}`);
    }

    const setupIntentCustomerId = getExpandableId(setupIntent.customer);
    paymentMethodService.assertSetupIntentBelongsToCustomer(setupIntentCustomerId, customer);

    const expandedPaymentMethod = setupIntent.payment_method;
    const stripePaymentMethod =
      typeof expandedPaymentMethod === 'string'
        ? await stripe.paymentMethods.retrieve(expandedPaymentMethod)
        : expandedPaymentMethod;

    if (!stripePaymentMethod || !stripePaymentMethod.card) {
      throw new BadRequestError('Setup intent did not produce a card payment method');
    }

    const savedPaymentMethod = await paymentMethodService.saveStripePaymentMethod(
      userId,
      customer,
      {
        id: stripePaymentMethod.id,
        card: stripePaymentMethod.card,
        billing_details: stripePaymentMethod.billing_details,
      },
      setAsDefault
    );

    logger.info(
      { userId, paymentMethodId: savedPaymentMethod.id, setupIntentId },
      'User payment method saved'
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Payment method saved',
      data: toUserPaymentMethodResponse(savedPaymentMethod),
    });
  } catch (error) {
    logger.error(error, 'finalize setup intent error');
    next(error);
  }
};

export const listPaymentMethods = async (
  req: Request<unknown, CommonResponseDTO<UserPaymentMethodResponseDTO[]>>,
  res: Response<CommonResponseDTO<UserPaymentMethodResponseDTO[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const paymentMethods = await paymentMethodService.listUserPaymentMethods(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: paymentMethods.map(toUserPaymentMethodResponse),
    });
  } catch (error) {
    logger.error(error, 'list payment methods error');
    next(error);
  }
};

export const setDefaultPaymentMethod = async (
  req: Request<PaymentMethodIdParamsDTO, CommonResponseDTO<UserPaymentMethodResponseDTO>>,
  res: Response<CommonResponseDTO<UserPaymentMethodResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { paymentMethodId } = req.params;
    const paymentMethod = await paymentMethodService.setDefaultUserPaymentMethod(
      userId,
      paymentMethodId
    );

    logger.info({ userId, paymentMethodId }, 'Default payment method updated');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Default payment method updated',
      data: toUserPaymentMethodResponse(paymentMethod),
    });
  } catch (error) {
    logger.error(error, 'set default payment method error');
    next(error);
  }
};

export const deletePaymentMethod = async (
  req: Request<PaymentMethodIdParamsDTO, CommonResponseDTO<UserPaymentMethodResponseDTO>>,
  res: Response<CommonResponseDTO<UserPaymentMethodResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { paymentMethodId } = req.params;
    const paymentMethod = await paymentMethodService.deleteUserPaymentMethod(
      userId,
      paymentMethodId
    );

    logger.info({ userId, paymentMethodId }, 'Payment method deleted');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment method deleted',
      data: toUserPaymentMethodResponse(paymentMethod),
    });
  } catch (error) {
    logger.error(error, 'delete payment method error');
    next(error);
  }
};

export const stripeWebhook = async (
  req: Request<unknown, CommonResponseDTO>,
  res: Response<CommonResponseDTO>,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      throw new BadRequestError('Missing Stripe signature');
    }

    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      environment.stripeWebhookSecret
    );

    const paymentStatus = getPaymentStatusForStripeEvent(event.type);

    if (!paymentStatus) {
      logger.info({ stripeEventId: event.id, type: event.type }, 'Stripe webhook ignored');

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Stripe webhook ignored',
      });
      return;
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const payment = await paymentService.findPaymentByProviderPaymentId(paymentIntent.id);

    if (!payment) {
      throw new PaymentNotFoundError(
        `Payment with provider payment id ${paymentIntent.id} not found`
      );
    }

    if (payment.status === paymentStatus) {
      await notifyOrderPaymentStatus(payment.orderId, payment.id, paymentStatus);
      await publishPaymentStatusEvent(payment);
    } else {
      await syncPaymentAndOrderStatus(payment.id, paymentStatus);
    }

    logger.info(
      {
        stripeEventId: event.id,
        type: event.type,
        paymentId: payment.id,
        orderId: payment.orderId,
        paymentStatus,
      },
      'Stripe webhook processed'
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Stripe webhook processed',
    });
  } catch (error) {
    logger.error(error, 'Stripe webhook error');
    next(error);
  }
};

export const confirmPayment = async (
  req: Request<PaymentIdParamsDTO, CommonResponseDTO<PaymentResponseDTO>>,
  res: Response<CommonResponseDTO<PaymentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError(`Payment with id ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      await notifyOrderPaymentStatus(payment.orderId, payment.id, PaymentStatus.SUCCEEDED);
      await publishPaymentStatusEvent(payment);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment already confirmed',
        data: payment,
      });
      return;
    }

    // Verify Stripe PaymentIntent status if it's a card payment
    if (payment.paymentMethod === PaymentMethod.CARD && payment.providerPaymentId) {
      const stripeIntent = await stripe.paymentIntents.retrieve(payment.providerPaymentId);

      if (stripeIntent.status !== 'succeeded') {
        logger.warn(
          { paymentId, stripeStatus: stripeIntent.status },
          'Stripe payment intent not succeeded'
        );
        throw new PaymentNotSucceededError(
          `Payment not completed in Stripe. Status: ${stripeIntent.status}`
        );
      }

      logger.info(
        { paymentId, stripePaymentIntentId: stripeIntent.id },
        'Stripe PaymentIntent verified as succeeded'
      );
    }

    const updated = await syncPaymentAndOrderStatus(paymentId, PaymentStatus.SUCCEEDED);

    logger.info({ paymentId }, 'Payment confirmed, status set to SUCCEEDED');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: updated,
    });
  } catch (error) {
    logger.error(error, 'confirm payment error');
    next(error);
  }
};

export const cancelPayment = async (
  req: Request<PaymentIdParamsDTO, CommonResponseDTO<PaymentResponseDTO>, CancelPaymentDTO>,
  res: Response<CommonResponseDTO<PaymentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { refundReason } = req.body;

    const payment = await paymentService.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError(`Payment with id ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      // Process refund via Stripe if it's a card payment
      if (payment.paymentMethod === PaymentMethod.CARD && payment.providerPaymentId) {
        const refund = await stripe.refunds.create(
          {
            payment_intent: payment.providerPaymentId,
            amount: payment.amount,
            reason: 'requested_by_customer',
            metadata: {
              paymentId,
              refundReason: refundReason ?? 'no reason provided',
            },
          },
          { idempotencyKey: `refund-${paymentId}-${payment.providerPaymentId}` }
        );

        logger.info(
          { paymentId, stripeRefundId: refund.id, refundReason },
          'Stripe refund processed'
        );
      }

      const updated = await paymentService.refundPayment(paymentId, refundReason);
      await publishPaymentStatusEvent(updated);

      logger.info({ paymentId, refundReason }, 'Payment refunded');

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment refunded successfully',
        data: updated,
      });
      return;
    }

    const updated = await syncPaymentAndOrderStatus(paymentId, PaymentStatus.CANCELLED);

    logger.info({ paymentId }, 'Payment cancelled');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment cancelled successfully',
      data: updated,
    });
  } catch (error) {
    logger.error(error, 'cancel payment error');
    next(error);
  }
};

export const getPaymentById = async (
  req: Request<PaymentIdParamsDTO, CommonResponseDTO<PaymentResponseDTO>>,
  res: Response<CommonResponseDTO<PaymentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError(`Payment with id ${paymentId} not found`);
    }

    logger.info({ paymentId }, 'Payment fetched');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    });
  } catch (error) {
    logger.error(error, 'get payment error');
    next(error);
  }
};

export const getPaymentByOrderId = async (
  req: Request<OrderIdParamsDTO, CommonResponseDTO<PaymentResponseDTO>>,
  res: Response<CommonResponseDTO<PaymentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const payment = await paymentService.findPaymentByOrderId(orderId);

    if (!payment) {
      throw new PaymentNotFoundError(`Payment for order ${orderId} not found`);
    }

    logger.info({ orderId, paymentId: payment.id }, 'Payment fetched by orderId');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    });
  } catch (error) {
    logger.error(error, 'get payment by orderId error');
    next(error);
  }
};
