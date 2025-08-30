import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/infrastructure/logging/logger';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', { 
          error: error.errors, 
          correlationId: req.correlationId 
        });
        
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      logger.error('Unexpected validation error', { error, correlationId: req.correlationId });
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Query validation error', { 
          error: error.errors, 
          correlationId: req.correlationId 
        });
        
        res.status(400).json({
          success: false,
          error: {
            message: 'Query validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      logger.error('Unexpected query validation error', { error, correlationId: req.correlationId });
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
};