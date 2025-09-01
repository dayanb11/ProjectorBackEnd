import { Request, Response } from 'express';
import { WorkersService } from '@/domain/workers/service';
import { WorkersRepository } from '@/domain/workers/repository';
import { ApiResponse, PaginationQuery } from '@/shared/types/api';
import { logger } from '@/infrastructure/logging/logger';

export class WorkersController {
  private workersService: WorkersService;

  constructor() {
    const workersRepository = new WorkersRepository();
    this.workersService = new WorkersService(workersRepository);
  }

  getWorkers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query as PaginationQuery;
      const filter = {
        employee_id: req.query.employee_id as string | undefined,
        full_name: req.query.full_name as string | undefined,
        division_id: req.query.division_id ? Number(req.query.division_id) : undefined,
        department_id: req.query.department_id ? Number(req.query.department_id) : undefined,
        team_id: req.query.team_id ? Number(req.query.team_id) : undefined,
        role_id: req.query.role_id ? Number(req.query.role_id) : undefined,
        email: req.query.email as string | undefined,
      };

      const result = await this.workersService.getWorkers(
        filter,
        page || 1,
        limit || 20,
        sortBy || 'created_at',
        sortOrder || 'desc'
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting workers', { error, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve workers',
          code: 'FETCH_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };

  getWorkerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid worker ID',
            code: 'INVALID_ID',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const worker = await this.workersService.getWorkerById(id);
      
      if (!worker) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Worker not found',
            code: 'NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: worker,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting worker by ID', { error, id: req.params.id, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve worker',
          code: 'FETCH_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };

  createWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const worker = await this.workersService.createWorker(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: worker,
        timestamp: new Date().toISOString(),
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating worker', { error, data: req.body, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create worker',
          code: 'CREATE_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(response);
    }
  };

  updateWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid worker ID',
            code: 'INVALID_ID',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const worker = await this.workersService.updateWorker(id, req.body);
      
      const response: ApiResponse = {
        success: true,
        data: worker,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error updating worker', { error, id: req.params.id, data: req.body, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update worker',
          code: 'UPDATE_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(response);
    }
  };

  deleteWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid worker ID',
            code: 'INVALID_ID',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      await this.workersService.deleteWorker(id);
      
      const response: ApiResponse = {
        success: true,
        data: { message: 'Worker deleted successfully' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error deleting worker', { error, id: req.params.id, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to delete worker',
          code: 'DELETE_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };
}