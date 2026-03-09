import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CommonResponseDTO, HealthCheckResponseBodyDTO } from '../dtos/common.dto';
import { checkDatabaseConnection } from '../config/database';
import { environment } from '../config/environment';

export const healthCheck = async (
  _req: Request,
  res: Response<CommonResponseDTO<HealthCheckResponseBodyDTO>>,
  next: NextFunction
) => {
  try {
    const db = await checkDatabaseConnection();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Health check successful',
      data: {
        db,
        service: environment.serviceName,
        timestamp: new Date().toISOString(),
        version: environment.version,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const fallback = async (_req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  });
};
