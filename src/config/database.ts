import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger';
import { environment } from './environment';
import { EnvironmentEnum } from '../utils/constants';
import { PRISMA_CODE } from '../utils/constants';

declare global {
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: environment.databaseUrl });

export const prisma = globalThis.__prisma || new PrismaClient({ adapter });

if (environment.env !== EnvironmentEnum.Production) {
  globalThis.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from database');
    throw error;
  }
}

export async function checkDatabaseConnection(): Promise<'connected' | 'disconnected'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

export const isPrismaErrorWithCode = (
  error: unknown,
  code: (typeof PRISMA_CODE)[keyof typeof PRISMA_CODE]
): boolean => {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
};
