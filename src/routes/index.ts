import { Router } from 'express';
import itemRoutes from './v1/item.routes';
import commonRoutes from './common.routes';
import { apiKeyMiddleware } from '../middleware/api-key.middleware';
import { environment } from '../config/environment';

const router = Router();

router.use('/v1/items', apiKeyMiddleware([environment.bffAPIKey]), itemRoutes);
router.use(commonRoutes);

export default router;
