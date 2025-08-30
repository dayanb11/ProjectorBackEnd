import { Request, Response, NextFunction } from 'express';
import { createCorrelationId } from '@/infrastructure/logging/logger';

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] as string || createCorrelationId();
  
  // Add to request object
  req.correlationId = correlationId;
  
  // Add to response headers
  res.setHeader('x-correlation-id', correlationId);
  
  next();
};