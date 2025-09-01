import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { environment } from './infrastructure/config/environment';
import { correlationMiddleware } from './api/middleware/correlation';
import { metricsMiddleware } from './api/middleware/metrics';
import { setupSwagger } from './api/swagger';
import { logger } from './infrastructure/logging/logger';

// Route imports
import { authRoutes } from './api/routes/auth.routes';
import { workersRoutes } from './api/routes/workers.routes';
import { programsRoutes } from './api/routes/programs.routes';
import { lookupRoutes } from './api/routes/lookup.routes';
import { healthRoutes, readyRouter } from './api/routes/health.routes';
import { metricsRoutes } from './api/routes/metrics.routes';

export function createApp(): express.Application {
  const app = express();
  const config = environment.get();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: config.CORS_ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom middleware
  app.use(correlationMiddleware);
  app.use(metricsMiddleware);

  // Health checks (no auth required)
  app.use('/health', healthRoutes);
  app.use('/ready', readyRouter);
  app.use('/metrics', metricsRoutes);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/workers', workersRoutes);
  app.use('/api/programs', programsRoutes);
  app.use('/api/lookup', lookupRoutes);

  // API documentation
  if (config.NODE_ENV !== 'production') {
    setupSwagger(app);
    logger.info('Swagger documentation available at /api-docs');
  }

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Projector Backend API',
        version: '1.0.0',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { 
      error: error.message, 
      stack: error.stack, 
      correlationId: req.correlationId 
    });

    res.status(500).json({
      success: false,
      error: {
        message: config.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        code: 'INTERNAL_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}