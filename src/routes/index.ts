import { Router } from 'express';
import paymentRoutes from './v1/payment.routes';
import commonRoutes from './common.routes';
import { apiKeyMiddleware } from '../middleware/api-key.middleware';
import { actorMiddleware } from '../middleware/actor.middleware';
import { environment } from '../config/environment';

const router = Router();

router.use(
  '/api/v1/payments',
  apiKeyMiddleware([environment.apiKey]),
  actorMiddleware,
  paymentRoutes
);
router.use(commonRoutes);

export default router;
