import express, { ErrorRequestHandler } from 'express';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { environment } from './config/environment';
import { errorHandler } from './middleware/error-handler.middleware';
import { rateLimiterMiddleware } from './middleware/rate-limiter.middleware';
import routes from './routes';

const app = express();

let isShuttingDown = false;

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// global rate limiter
app.use(rateLimiterMiddleware);

// Routes
app.use(routes);

app.use(errorHandler as ErrorRequestHandler);

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(environment.port, () => {
      logger.info(
        { port: environment.port, env: environment.env, service: environment.serviceName },
        'Server started successfully'
      );
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;

      logger.info(`${signal} received. Shutting down gracefully...`);

      try {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
        logger.info('HTTP server closed');

        await disconnectDatabase();
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
