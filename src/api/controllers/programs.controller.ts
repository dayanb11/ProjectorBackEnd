import { Request, Response } from 'express';
import { ProgramService } from '@/domain/programs/service';
import { ProgramRepository } from '@/domain/programs/repository';
import { ApiResponse, PaginationQuery } from '@/shared/types/api';
import { logger } from '@/infrastructure/logging/logger';

export class ProgramsController {
  private programService: ProgramService;

  constructor() {
    const programRepository = new ProgramRepository();
    this.programService = new ProgramService(programRepository);
  }

  getPrograms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query as PaginationQuery;
      const filter = {
        work_year: req.query.work_year ? Number(req.query.work_year) : undefined as number | undefined,
        required_quarter: req.query.required_quarter as string | undefined,
        title: req.query.title as string | undefined,
        status_key: req.query.status_key as string | undefined,
        domain_id: req.query.domain_id ? Number(req.query.domain_id) : undefined,
        engagement_type_id: req.query.engagement_type_id ? Number(req.query.engagement_type_id) : undefined,
        department_id: req.query.department_id ? Number(req.query.department_id) : undefined,
        assignee_worker_id: req.query.assignee_worker_id ? Number(req.query.assignee_worker_id) : undefined,
        requester_worker_id: req.query.requester_worker_id ? Number(req.query.requester_worker_id) : undefined,
        planning_source: req.query.planning_source as string | undefined,
        complexity_level: req.query.complexity_level ? Number(req.query.complexity_level) : undefined,
      };

      const result = await this.programService.getPrograms(
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
      logger.error('Error getting programs', { error, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve programs',
          code: 'FETCH_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };

  getProgramById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid program ID',
            code: 'INVALID_ID',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const program = await this.programService.getProgramById(id);
      
      if (!program) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Program not found',
            code: 'NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: program,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting program by ID', { error, id: req.params.id, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve program',
          code: 'FETCH_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };

  createProgram = async (req: Request, res: Response): Promise<void> => {
    try {
      const program = await this.programService.createProgram(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: program,
        timestamp: new Date().toISOString(),
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating program', { error, data: req.body, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create program',
          code: 'CREATE_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(response);
    }
  };

  updateProgram = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid program ID',
            code: 'INVALID_ID',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const program = await this.programService.updateProgram(id, req.body);
      
      const response: ApiResponse = {
        success: true,
        data: program,
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error updating program', { error, id: req.params.id, data: req.body, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update program',
          code: 'UPDATE_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(response);
    }
  };

  deleteProgram = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid program ID',
            code: 'INVALID_ID',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      await this.programService.deleteProgram(id);
      
      const response: ApiResponse = {
        success: true,
        data: { message: 'Program deleted successfully' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error deleting program', { error, id: req.params.id, correlationId: req.correlationId });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to delete program',
          code: 'DELETE_ERROR',
        },
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  };
}