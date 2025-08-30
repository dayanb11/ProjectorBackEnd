import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/domain/auth/service';
import { WorkersService } from '@/domain/workers/service';
import { WorkersRepository } from '@/domain/workers/repository';
import { JWTPayload } from '@/shared/types/auth';
import { logger } from '@/infrastructure/logging/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      correlationId?: string;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    const workersRepository = new WorkersRepository();
    const workersService = new WorkersService(workersRepository);
    this.authService = new AuthService(workersService);
  }

  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Access token required',
            code: 'UNAUTHORIZED',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const token = authHeader.substring(7);
      const payload = this.authService.verifyAccessToken(token);
      
      req.user = payload;
      next();
    } catch (error) {
      logger.error('Authentication failed', { error, correlationId: req.correlationId });
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired access token',
          code: 'UNAUTHORIZED',
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  authorize = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: {
              message: 'Authentication required',
              code: 'UNAUTHORIZED',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Get worker with role permissions
        const workersRepository = new WorkersRepository();
        const worker = await workersRepository.findById(req.user.user_id);
        
        if (!worker) {
          res.status(401).json({
            success: false,
            error: {
              message: 'Worker not found',
              code: 'UNAUTHORIZED',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Parse role permissions (assuming JSON format)
        let userPermissions: string[] = [];
        try {
          userPermissions = JSON.parse(worker.role.role_permissions);
        } catch {
          userPermissions = [worker.role.role_permissions];
        }

        // Check if user has required permissions
        const hasPermission = requiredPermissions.every(permission => 
          userPermissions.includes(permission) || userPermissions.includes('*')
        );

        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: {
              message: 'Insufficient permissions',
              code: 'FORBIDDEN',
              details: { required: requiredPermissions, user: userPermissions },
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        next();
      } catch (error) {
        logger.error('Authorization failed', { error, correlationId: req.correlationId });
        res.status(500).json({
          success: false,
          error: {
            message: 'Authorization check failed',
            code: 'INTERNAL_ERROR',
          },
          timestamp: new Date().toISOString(),
        });
      }
    };
  };
}