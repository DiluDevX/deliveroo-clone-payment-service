import { Router } from 'express';
import { fallback, healthCheck } from '../controllers/common.controller';

const router = Router();

router.get('/', healthCheck);

router.use(fallback);

export default router;
