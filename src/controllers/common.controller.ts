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

export const readinessCheck = async (
  _req: Request,
  res: Response<CommonResponseDTO<HealthCheckResponseBodyDTO>>,
  next: NextFunction
) => {
  try {
    const db = await checkDatabaseConnection();

    const isReady = db === 'connected';

    res.status(isReady ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
      success: isReady,
      message: isReady ? 'Service is ready' : 'Service is not ready',
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

export const livenessCheck = (
  _req: Request,
  res: Response<CommonResponseDTO<Pick<HealthCheckResponseBodyDTO, 'service' | 'timestamp'>>>
) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Service is alive',
    data: {
      service: environment.serviceName,
      timestamp: new Date().toISOString(),
    },
  });
};

export const fallback = async (_req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  });
};
