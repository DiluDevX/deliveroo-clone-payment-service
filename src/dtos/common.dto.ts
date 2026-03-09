import { z } from 'zod';
import { commonRequestQueryParamsSchema, idRequestPathParamsSchema } from '../schema/common.schema';

export interface CommonResponseDTO<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginationInfoDTO {
  page?: number;
  limit?: number;
  totalPages?: number;
  total: number;
}

export type HealthCheckResponseBodyDTO = {
  db: 'connected' | 'disconnected' | 'unknown';
  version: string;
  timestamp: string;
  service: string;
};

export interface PaginatedResponseDTO<T = unknown> extends CommonResponseDTO<T[]> {
  pagination: PaginationInfoDTO;
}

export type IdRequestPathParamsDTO = z.infer<typeof idRequestPathParamsSchema>;
export type CommonRequestQueryParamsDTO = z.infer<typeof commonRequestQueryParamsSchema>;
