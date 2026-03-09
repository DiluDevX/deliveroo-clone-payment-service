import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { environment } from '../config/environment';
import { Prisma } from '../../generated/prisma/client.js';
import { StatusCodes } from 'http-status-codes';
import { EnvironmentEnum, PRISMA_CODE } from '../utils/constants';
import { CommonResponseDTO } from '../dtos/common.dto';
interface ErrorResponseDTO extends CommonResponseDTO {
  code?: string;
  stack?: string;
}

function handleAppError(err: AppError, res: Response): void {
  const response: ErrorResponseDTO = {
    success: false,
    message: err.message,
    code: err.code,
  };

  if (environment.env !== EnvironmentEnum.Production) {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
}

function handlePrismaError(err: Error, res: Response): boolean {
  if (err.name !== 'PrismaClientKnownRequestError') {
    return false;
  }

  const prismaError = err as Prisma.PrismaClientKnownRequestError;

  if (prismaError.code === PRISMA_CODE.CONFLICT) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: 'A record with this value already exists',
    });
    return true;
  }

  if (prismaError.code === PRISMA_CODE.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Record not found',
    });
    return true;
  }

  return false;
}

function handleJwtError(err: Error, res: Response): boolean {
  if (err.name === 'JsonWebTokenError') {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
    });
    return true;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
    });
    return true;
  }

  return false;
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof AppError) {
    handleAppError(err, res);
    return;
  }

  if (handlePrismaError(err, res) || handleJwtError(err, res)) {
    return;
  }

  const response: ErrorResponseDTO = {
    success: false,
    message:
      environment.env === EnvironmentEnum.Production
        ? 'Internal Server Error'
        : (err.message ?? 'Internal Server Error'),
  };

  if (environment.env !== EnvironmentEnum.Production) {
    response.stack = err.stack;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
}
