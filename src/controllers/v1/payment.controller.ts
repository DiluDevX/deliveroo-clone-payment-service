import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as paymentService from '../../services/payment.database.service';
import { logger } from '../../utils/logger';
import { PaymentNotFoundError, PaymentAlreadyProcessedError } from '../../utils/errors';
import { stripe } from '../../config/stripe';
import { CommonResponseDTO } from '../../dtos/common.dto';
import {
  CreatePaymentIntentDTO,
  CancelPaymentDTO,
  PaymentIdParamsDTO,
  OrderIdParamsDTO,
  PaymentResponseDTO,
  CreatePaymentIntentResponseDTO,
} from '../../dtos/payment.dto';
import { PaymentStatus, PaymentMethod, Prisma } from '../../../generated/prisma/client.js';

export const createPaymentIntent = async (
  req: Request<unknown, CommonResponseDTO<CreatePaymentIntentResponseDTO>, CreatePaymentIntentDTO>,
  res: Response<CommonResponseDTO<CreatePaymentIntentResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, userId, restaurantId, amount, currency, paymentMethod, commissionPercentage } =
      req.body;

    const commissionValue = (amount * commissionPercentage) / 100;
    const transferAmount = amount - commissionValue;

    const payment = await paymentService.createPayment({
      orderId,
      userId,
      restaurantId,
      amount,
      currency,
      commissionPercentage,
      commissionValue,
      transferAmount,
      paymentMethod: paymentMethod as PaymentMethod,
      status: PaymentStatus.PENDING,
    });

    logger.info({ paymentId: payment.id, orderId, paymentMethod }, 'Payment created');

    if (paymentMethod === 'CARD') {
      // Create real Stripe PaymentIntent
      const stripeIntent = await stripe.paymentIntents.create({
        amount: Math.round(transferAmount * 100), // Amount in cents
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          paymentId: payment.id,
          orderId,
          userId,
          restaurantId,
        },
        statement_descriptor: 'Deliveroo Order',
      });

      // Store Stripe PaymentIntent ID and response in database
      const updatedPayment = await paymentService.setProviderPaymentId(
        payment.id,
        stripeIntent.id,
        stripeIntent.metadata as Prisma.InputJsonValue
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

    // CASH_ON_DELIVERY: set status to PROCESSING immediately
    const updated = await paymentService.updatePaymentStatus(payment.id, PaymentStatus.PROCESSING);

    logger.info(
      { paymentId: payment.id },
      'Payment status set to PROCESSING (cash on delivery) for payment id: ' + payment.id
    );

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
      throw new PaymentAlreadyProcessedError('Payment has already been confirmed');
    }

    // Verify Stripe PaymentIntent status if it's a card payment
    if (payment.paymentMethod === 'CARD' && payment.providerPaymentId) {
      const stripeIntent = await stripe.paymentIntents.retrieve(payment.providerPaymentId);

      if (stripeIntent.status !== 'succeeded') {
        logger.warn(
          { paymentId, stripeStatus: stripeIntent.status },
          'Stripe payment intent not succeeded'
        );
        throw new Error(`Payment not completed in Stripe. Status: ${stripeIntent.status}`);
      }

      logger.info(
        { paymentId, stripePaymentIntentId: stripeIntent.id },
        'Stripe PaymentIntent verified as succeeded'
      );
    }

    const updated = await paymentService.updatePaymentStatus(paymentId, PaymentStatus.SUCCEEDED);

    logger.info({ paymentId }, 'Payment confirmed, status set to SUCCEEDED');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: updated as PaymentResponseDTO,
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
      if (payment.paymentMethod === 'CARD' && payment.providerPaymentId) {
        const refund = await stripe.refunds.create({
          payment_intent: payment.providerPaymentId,
          reason: 'requested_by_customer',
        });

        logger.info(
          { paymentId, stripeRefundId: refund.id, refundReason },
          'Stripe refund processed'
        );
      }

      const updated = await paymentService.refundPayment(paymentId, refundReason);

      logger.info({ paymentId, refundReason }, 'Payment refunded');

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment refunded successfully',
        data: updated as PaymentResponseDTO,
      });
      return;
    }

    const updated = await paymentService.updatePaymentStatus(paymentId, PaymentStatus.CANCELLED);

    logger.info({ paymentId }, 'Payment cancelled');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment cancelled successfully',
      data: updated as PaymentResponseDTO,
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
      data: payment as PaymentResponseDTO,
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
      data: payment as PaymentResponseDTO,
    });
  } catch (error) {
    logger.error(error, 'get payment by orderId error');
    next(error);
  }
};
