import pino from 'pino';
import { environment } from '../config/environment';
import { EnvironmentEnum } from './constants';

const transportOptions = {
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
};

const pinoOptions: pino.LoggerOptions = {
  level: environment.logging.level,
  base: {
    service: environment.serviceName,
    env: environment.env,
  },
};

if (environment.env !== EnvironmentEnum.Production) {
  try {
    require.resolve('pino-pretty');
    (pinoOptions as { transport?: object }).transport = {
      target: 'pino-pretty',
      options: transportOptions,
    };
  } catch {
    // pino-pretty not available
  }
}

export const logger = pino(pinoOptions);
