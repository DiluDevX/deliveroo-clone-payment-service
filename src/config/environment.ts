import dotenv from 'dotenv';
import { EnvironmentEnum } from '../utils/constants';
dotenv.config();

interface MailConfig {
  companyName: string;
  companyEmail: string;
  logoUrl: string;
  supportEmail: string;
  appUrl: string;
  resendApiKey: string;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface Environment {
  port: number;
  env: EnvironmentEnum;
  databaseUrl: string;
  baseUrl: string;
  version: string;

  logging: {
    level: string;
  };
  bffAPIKey: string;
  serviceName: string;
  mail: MailConfig;
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

function loadMailConfig(env: EnvironmentEnum): MailConfig {
  const isProduction = env === EnvironmentEnum.Production;

  if (isProduction) {
    return {
      companyName: requireEnv('COMPANY_NAME'),
      companyEmail: requireEnv('COMPANY_EMAIL'),
      logoUrl: requireEnv('LOGO_URL'),
      supportEmail: requireEnv('SUPPORT_EMAIL'),
      appUrl: requireEnv('APP_URL'),
      resendApiKey: requireEnv('RESEND_API_KEY'),
    };
  }

  return {
    companyName: optionalEnv('COMPANY_NAME', 'Local Development'),
    companyEmail: optionalEnv('COMPANY_EMAIL', 'noreply@localhost'),
    logoUrl: optionalEnv('LOGO_URL', 'https://via.placeholder.com/200?text=Logo'),
    supportEmail: optionalEnv('SUPPORT_EMAIL', 'support@localhost'),
    appUrl: optionalEnv('APP_URL', 'http://localhost:3000'),
    resendApiKey: optionalEnv('RESEND_API_KEY', 'test-key-development-only'),
  };
}

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
  port: parsePositiveInt(optionalEnv('PORT', '3000'), 'PORT'),
  env: environment_raw,
  version: optionalEnv('APP_VERSION', '1.0.0'),
  databaseUrl: requireEnv('DATABASE_URL'),
  baseUrl: optionalEnv('BASE_URL', 'http://localhost:3000'),
  logging: {
    level: optionalEnv('LOG_LEVEL', 'info'),
  },
  bffAPIKey: requireEnv('BFF_API_KEY'),
  mail: loadMailConfig(environment_raw),
  rateLimit: loadRateLimitConfig(environment_raw),
  serviceName: requireEnv('SERVICE_NAME'),
};
