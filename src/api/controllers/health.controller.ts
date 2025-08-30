import { Request, Response } from 'express';
import { prisma } from '@/infrastructure/db/client';
import { HealthCheck, ApiResponse } from '@/shared/types/api';
import { logger } from '@/infrastructure/logging/logger';

export class HealthController {
  health = async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now();
      
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - startTime;
      
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

      const healthData: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected',
          latency: dbLatency,
        },
        memory: {
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentage: memoryPercentage,
        },
      };

      const response: ApiResponse<HealthCheck> = {
        success: true,
        data: healthData,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Health check failed', { error, correlationId: req.correlationId });
      
      const healthData: HealthCheck = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'disconnected',
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      };

      const response: ApiResponse<HealthCheck> = {
        success: false,
        data: healthData,
        error: {
          message: 'Health check failed',
          code: 'HEALTH_CHECK_FAILED',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(503).json(response);
    }
  };

  ready = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if database is ready
      await prisma.$queryRaw`SELECT 1`;
      
      const response: ApiResponse = {
        success: true,
        data: { status: 'ready' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Readiness check failed', { error, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Service not ready',
          code: 'NOT_READY',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(503).json(response);
    }
  };
}