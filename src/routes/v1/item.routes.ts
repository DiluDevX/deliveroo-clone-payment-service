import { Router } from 'express';
import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  updateItem,
} from '../../controllers/v1/item.controller';

import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware';
import {
  commonRequestQueryParamsSchema,
  idRequestPathParamsSchema,
} from '../../schema/common.schema';
import { createItemRequestBodySchema, updateItemRequestBodySchema } from '../../schema/item.schema';

const router = Router();

router.get('/', validateQuery(commonRequestQueryParamsSchema), getAllItems);

router.get('/:id', validateParams(idRequestPathParamsSchema), getItemById);

router.post('/', validateBody(createItemRequestBodySchema), createItem);

router.patch(
  '/:id',
  validateParams(idRequestPathParamsSchema),
  validateBody(updateItemRequestBodySchema),
  updateItem
);

router.delete('/:id', validateParams(idRequestPathParamsSchema), deleteItem);

export default router;
