import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '@/infrastructure/metrics/prometheus';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
  });
  
  next();
};