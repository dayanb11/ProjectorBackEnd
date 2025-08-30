import 'dotenv/config';
import { createApp } from './app';
import { environment } from './infrastructure/config/environment';
import { initializeDatabase, validateDatabaseSchema } from './infrastructure/startup/database';
import { validatePasswordSecurity, validateEnvironmentSecurity } from './infrastructure/startup/security';
import { logger } from './infrastructure/logging/logger';

async function startServer(): Promise<void> {
  try {
    const config = environment.get();
    
    logger.info('Starting Projector Backend...', {
      environment: config.NODE_ENV,
      port: config.PORT,
    });

    // Validate environment security
    await validateEnvironmentSecurity();

    // Initialize database
    await initializeDatabase();
    await validateDatabaseSchema();

    // Validate password security
    await validatePasswordSecurity();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info('Server started successfully', {
        port: config.PORT,
        environment: config.NODE_ENV,
        publicUrl: config.PUBLIC_URL,
      });

      if (config.NODE_ENV !== 'production') {
        logger.info('Development endpoints available:', {
          api: `${config.PUBLIC_URL}/api`,
          health: `${config.PUBLIC_URL}/health`,
          docs: `${config.PUBLIC_URL}/api-docs`,
          metrics: `${config.PUBLIC_URL}/metrics`,
        });
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          const { DatabaseClient } = await import('./infrastructure/db/client');
          await DatabaseClient.disconnect();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

startServer();