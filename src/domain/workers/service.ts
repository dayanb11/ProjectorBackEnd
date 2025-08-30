import { WorkersRepository, WorkersFilter, WorkersWithRelations } from './repository';
import { PaginatedResponse } from '@/shared/types/api';
import { logger } from '@/infrastructure/logging/logger';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';

export class WorkersService {
  constructor(private workersRepository: WorkersRepository) {}

  async getWorkerById(id: number): Promise<WorkersWithRelations | null> {
    return this.workersRepository.findById(id);
  }

  async getWorkerByEmployeeId(employeeId: string): Promise<WorkersWithRelations | null> {
    return this.workersRepository.findByEmployeeId(employeeId);
  }

  async getWorkers(
    filter: WorkersFilter = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<WorkersWithRelations>> {
    const skip = (page - 1) * limit;
    const orderBy: Prisma.WorkersOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const { workers, total } = await this.workersRepository.findMany(
      filter,
      { skip, take: limit },
      orderBy
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: workers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async createWorker(data: {
    employee_id: string;
    full_name: string;
    job_description: string;
    division_id: number;
    department_id: number;
    team_id: number;
    role_id: number;
    password: string;
    available_work_days?: number;
    email: string;
  }): Promise<WorkersWithRelations> {
    // Hash password
    const password_hash = await argon2.hash(data.password);

    const createData: Prisma.WorkersCreateInput = {
      employee_id: data.employee_id,
      full_name: data.full_name,
      job_description: data.job_description,
      password_hash,
      available_work_days: data.available_work_days || 5,
      email: data.email,
      division: { connect: { division_id: data.division_id } },
      department: { connect: { department_id: data.department_id } },
      team: { connect: { team_id: data.team_id } },
      role: { connect: { role_id: data.role_id } },
    };

    const worker = await this.workersRepository.create(createData);
    
    // Return with relations
    const workerWithRelations = await this.workersRepository.findById(worker.worker_id);
    if (!workerWithRelations) {
      throw new Error('Failed to retrieve created worker');
    }
    
    return workerWithRelations;
  }

  async updateWorker(
    id: number,
    data: Partial<{
      full_name: string;
      job_description: string;
      division_id: number;
      department_id: number;
      team_id: number;
      role_id: number;
      password: string;
      available_work_days: number;
      email: string;
    }>
  ): Promise<WorkersWithRelations> {
    const updateData: Prisma.WorkersUpdateInput = {};

    if (data.full_name) updateData.full_name = data.full_name;
    if (data.job_description) updateData.job_description = data.job_description;
    if (data.available_work_days) updateData.available_work_days = data.available_work_days;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password_hash = await argon2.hash(data.password);
    
    if (data.division_id) updateData.division = { connect: { division_id: data.division_id } };
    if (data.department_id) updateData.department = { connect: { department_id: data.department_id } };
    if (data.team_id) updateData.team = { connect: { team_id: data.team_id } };
    if (data.role_id) updateData.role = { connect: { role_id: data.role_id } };

    await this.workersRepository.update(id, updateData);
    
    const updatedWorker = await this.workersRepository.findById(id);
    if (!updatedWorker) {
      throw new Error('Failed to retrieve updated worker');
    }
    
    return updatedWorker;
  }

  async deleteWorker(id: number): Promise<void> {
    await this.workersRepository.delete(id);
    logger.info('Worker deleted', { worker_id: id });
  }

  async validateCredentials(employeeId: string, password: string): Promise<WorkersWithRelations | null> {
    const worker = await this.workersRepository.findByEmployeeId(employeeId);
    
    if (!worker) {
      logger.warn('Login attempt with invalid employee ID', { employeeId });
      return null;
    }

    const isValidPassword = await argon2.verify(worker.password_hash, password);
    
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { employeeId });
      return null;
    }

    logger.info('Successful login', { employeeId, worker_id: worker.worker_id });
    return worker;
  }
}