import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as itemService from '../../services/item.database.service';
import { logger } from '../../utils/logger';
import {
  CommonRequestQueryParamsDTO,
  CommonResponseDTO,
  IdRequestPathParamsDTO,
  PaginatedResponseDTO,
} from '../../dtos/common.dto';
import {
  CreateItemRequestBodyDTO,
  CreateItemResponseDTO,
  GetItemResponseDTO,
  UpdateItemRequestBodyDTO,
  UpdateItemResponseDTO,
} from '../../dtos/item.dto';
import { NotFoundError } from '../../utils/errors';

export const createItem = async (
  req: Request<unknown, CommonResponseDTO<CreateItemResponseDTO>, CreateItemRequestBodyDTO>,
  res: Response<CommonResponseDTO<CreateItemResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;

    logger.debug({ name }, 'create item request');

    const item = await itemService.create({
      name,
      description,
    });

    logger.debug({ id: item.id }, 'created item');

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Item created successfully',
      data: item,
    });
  } catch (error) {
    logger.error(error, 'create item error');

    next(error);
  }
};

export const getAllItems = async (
  req: Request<
    unknown,
    PaginatedResponseDTO<GetItemResponseDTO>,
    unknown,
    CommonRequestQueryParamsDTO
  >,
  res: Response<PaginatedResponseDTO<GetItemResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, sortBy, sortOrder = 'desc' } = req.query;

    const parsedPage = page ? Number.parseInt(page) : undefined;
    const parsedLimit = limit ? Number.parseInt(limit) : undefined;

    let skip;
    if (parsedPage && parsedLimit) {
      skip = (parsedPage - 1) * parsedLimit;
    }

    let take;
    if (parsedLimit) {
      take = parsedLimit;
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder } : undefined;

    const [items, total] = await Promise.all([
      itemService.findMany({}, { skip, take }, orderBy),
      itemService.count(),
    ]);

    let totalPages;
    if (parsedPage && parsedLimit) {
      totalPages = Math.ceil(total / parsedLimit);
    }

    logger.info(
      {
        count: items.length,
        page,
        limit,
        total,
        totalPages,
        sortBy,
        sortOrder,
      },
      'items fetched'
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Items retrieved successfully',
      data: items,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error(error, 'get all items error');

    next(error);
  }
};

export const getItemById = async (
  req: Request<IdRequestPathParamsDTO, CommonResponseDTO<GetItemResponseDTO>>,
  res: Response<CommonResponseDTO<GetItemResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await itemService.findOneById(id);

    logger.info({ id: item?.id }, 'item fetched');

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Item retrieved successfully',
      data: item,
    });
  } catch (error) {
    logger.error(error, 'get item error');

    next(error);
  }
};

export const updateItem = async (
  req: Request<
    IdRequestPathParamsDTO,
    CommonResponseDTO<UpdateItemResponseDTO>,
    UpdateItemRequestBodyDTO
  >,
  res: Response<CommonResponseDTO<UpdateItemResponseDTO>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const updatedItem = await itemService.update(id, req.body);

    logger.info({ id: updatedItem.id }, 'updatedItem');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    logger.error(error, 'item update error');

    next(error);
  }
};

export const deleteItem = async (
  req: Request<IdRequestPathParamsDTO>,
  res: Response<CommonResponseDTO>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info({ id }, 'delete item request');

    await itemService.softDelete(id);

    logger.info({ id }, 'item deleted');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Item deleted successfully',
      data: null,
    });
  } catch (error) {
    logger.error(error, 'item delete error');

    next(error);
  }
};
