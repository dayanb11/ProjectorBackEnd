import { Request, Response } from 'express';
import { AuthService } from '@/domain/auth/service';
import { WorkersService } from '@/domain/workers/service';
import { WorkersRepository } from '@/domain/workers/repository';
import { LoginRequest, RefreshRequest } from '@/shared/types/auth';
import { ApiResponse } from '@/shared/types/api';
import { logger } from '@/infrastructure/logging/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const workersRepository = new WorkersRepository();
    const workersService = new WorkersService(workersRepository);
    this.authService = new AuthService(workersService);
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, password }: LoginRequest = req.body;
      
      const result = await this.authService.login(employeeId, password);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Login failed', { error, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Login failed',
          code: 'LOGIN_FAILED',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(401).json(response);
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token }: RefreshRequest = req.body;
      
      const result = await this.authService.refresh(refresh_token);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Token refresh failed', { error, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Token refresh failed',
          code: 'REFRESH_FAILED',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(401).json(response);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token }: RefreshRequest = req.body;
      
      await this.authService.logout(refresh_token);
      
      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Logout failed', { error, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Logout failed',
          code: 'LOGOUT_FAILED',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };
}