import { Router } from 'express';
import {
  createPaymentIntent,
  createSetupIntent,
  finalizeSetupIntent,
  listPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  confirmPayment,
  cancelPayment,
  getPaymentById,
  getPaymentByOrderId,
} from '../../controllers/v1/payment.controller';
import { validateBody, validateParams } from '../../middleware/validate.middleware';
import {
  CreatePaymentIntentSchema,
  FinalizeSetupIntentSchema,
  PaymentIdParamsSchema,
  PaymentMethodIdParamsSchema,
  OrderIdParamsSchema,
  CancelPaymentSchema,
} from '../../schema/payment.schema';

const router = Router();

router.post('/create-intent', validateBody(CreatePaymentIntentSchema), createPaymentIntent);

router.get('/payment-methods', listPaymentMethods);

router.post('/payment-methods/setup-intent', createSetupIntent);

router.post(
  '/payment-methods/finalize',
  validateBody(FinalizeSetupIntentSchema),
  finalizeSetupIntent
);

router.patch(
  '/payment-methods/:paymentMethodId/default',
  validateParams(PaymentMethodIdParamsSchema),
  setDefaultPaymentMethod
);

router.delete(
  '/payment-methods/:paymentMethodId',
  validateParams(PaymentMethodIdParamsSchema),
  deletePaymentMethod
);

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
