import dotenv from 'dotenv';
import { EnvironmentEnum } from '../utils/constants';
dotenv.config();

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface Environment {
  port: number;
  env: EnvironmentEnum;
  databaseUrl: string;
  version: string;

  logging: {
    level: string;
  };
  apiKey: string;
  serviceName: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  rateLimit: RateLimitConfig;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

const parsePositiveInt = (raw: string, name: string): number => {
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Invalid ${name} value: ${value}. Must be a positive integer.`);
  }
  return value;
};

function loadRateLimitConfig(env: EnvironmentEnum): RateLimitConfig {
  const defaults = {
    [EnvironmentEnum.Production]: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    [EnvironmentEnum.Development]: {
      windowMs: 15 * 60 * 1000,
      max: 1000,
    },
    [EnvironmentEnum.Test]: {
      windowMs: 1 * 60 * 1000,
      max: 10000,
    },
  };

  const envDefaults = defaults[env];

  return {
    windowMs: parsePositiveInt(
      optionalEnv('RATE_LIMIT_WINDOW_MS', envDefaults.windowMs.toString()),
      'RATE_LIMIT_WINDOW_MS'
    ),
    max: parsePositiveInt(
      optionalEnv('RATE_LIMIT_MAX', envDefaults.max.toString()),
      'RATE_LIMIT_MAX'
    ),
  };
}

const rawEnv = optionalEnv('NODE_ENV', 'development');
const validEnvs = Object.values(EnvironmentEnum);
if (!validEnvs.includes(rawEnv as EnvironmentEnum)) {
  throw new Error(`Invalid NODE_ENV value: ${rawEnv}. Must be one of ${validEnvs.join(', ')}`);
}

const environment_raw = rawEnv as EnvironmentEnum;

export const environment: Environment = {
  port: parsePositiveInt(optionalEnv('PORT', '3001'), 'PORT'),
  env: environment_raw,
  version: optionalEnv('APP_VERSION', '1.0.0'),
  databaseUrl: requireEnv('DATABASE_URL'),
  logging: {
    level: optionalEnv('LOG_LEVEL', 'info'),
  },
  apiKey: requireEnv('API_KEY'),
  stripeSecretKey: requireEnv('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
  rateLimit: loadRateLimitConfig(environment_raw),
  serviceName: requireEnv('SERVICE_NAME'),
};
