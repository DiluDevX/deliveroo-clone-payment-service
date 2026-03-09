import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  cancelPayment,
  getPaymentById,
  getPaymentByOrderId,
} from '../../controllers/v1/payment.controller';
import { validateBody, validateParams } from '../../middleware/validate.middleware';
import {
  CreatePaymentIntentSchema,
  PaymentIdParamsSchema,
  OrderIdParamsSchema,
  CancelPaymentSchema,
} from '../../schema/payment.schema';

const router = Router();

router.post('/create-intent', validateBody(CreatePaymentIntentSchema), createPaymentIntent);

router.get('/order/:orderId', validateParams(OrderIdParamsSchema), getPaymentByOrderId);

router.get('/:paymentId', validateParams(PaymentIdParamsSchema), getPaymentById);

router.post('/:paymentId/confirm', validateParams(PaymentIdParamsSchema), confirmPayment);

router.post(
  '/:paymentId/cancel',
  validateParams(PaymentIdParamsSchema),
  validateBody(CancelPaymentSchema),
  cancelPayment
);

export default router;
