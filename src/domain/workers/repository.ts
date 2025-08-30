import { prisma } from '@/infrastructure/db/client';
import { Workers, Prisma } from '@prisma/client';
import { logger } from '@/infrastructure/logging/logger';

export interface WorkersFilter {
  employee_id?: string;
  full_name?: string;
  division_id?: number;
  department_id?: number;
  team_id?: number;
  role_id?: number;
  email?: string;
}

export interface WorkersWithRelations extends Workers {
  division: {
    division_id: number;
    division_name: string;
    is_internal: boolean;
  };
  department: {
    department_id: number;
    department_name: string;
  };
  team: {
    team_id: number;
    team_name: string;
  };
  role: {
    role_id: number;
    role_description: string;
    role_permissions: string;
  };
}

export class WorkersRepository {
  async findById(id: number): Promise<WorkersWithRelations | null> {
    try {
      return await prisma.workers.findUnique({
        where: { worker_id: id },
        include: {
          division: true,
          department: true,
          team: true,
          role: true,
        },
      });
    } catch (error) {
      logger.error('Error finding worker by ID', { error, id });
      throw error;
    }
  }

  async findByEmployeeId(employeeId: string): Promise<WorkersWithRelations | null> {
    try {
      return await prisma.workers.findUnique({
        where: { employee_id: employeeId },
        include: {
          division: true,
          department: true,
          team: true,
          role: true,
        },
      });
    } catch (error) {
      logger.error('Error finding worker by employee ID', { error, employeeId });
      throw error;
    }
  }

  async findMany(
    filter: WorkersFilter = {},
    pagination: { skip: number; take: number },
    orderBy?: Prisma.WorkersOrderByWithRelationInput
  ): Promise<{ workers: WorkersWithRelations[]; total: number }> {
    try {
      const where: Prisma.WorkersWhereInput = {
        ...(filter.employee_id && { employee_id: { contains: filter.employee_id, mode: 'insensitive' } }),
        ...(filter.full_name && { full_name: { contains: filter.full_name, mode: 'insensitive' } }),
        ...(filter.division_id && { division_id: filter.division_id }),
        ...(filter.department_id && { department_id: filter.department_id }),
        ...(filter.team_id && { team_id: filter.team_id }),
        ...(filter.role_id && { role_id: filter.role_id }),
        ...(filter.email && { email: { contains: filter.email, mode: 'insensitive' } }),
      };

      const [workers, total] = await Promise.all([
        prisma.workers.findMany({
          where,
          include: {
            division: true,
            department: true,
            team: true,
            role: true,
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: orderBy || { created_at: 'desc' },
        }),
        prisma.workers.count({ where }),
      ]);

      return { workers, total };
    } catch (error) {
      logger.error('Error finding workers', { error, filter, pagination });
      throw error;
    }
  }

  async create(data: Prisma.WorkersCreateInput): Promise<Workers> {
    try {
      return await prisma.workers.create({ data });
    } catch (error) {
      logger.error('Error creating worker', { error, data });
      throw error;
    }
  }

  async update(id: number, data: Prisma.WorkersUpdateInput): Promise<Workers> {
    try {
      return await prisma.workers.update({
        where: { worker_id: id },
        data,
      });
    } catch (error) {
      logger.error('Error updating worker', { error, id, data });
      throw error;
    }
  }

  async delete(id: number): Promise<Workers> {
    try {
      return await prisma.workers.delete({
        where: { worker_id: id },
      });
    } catch (error) {
      logger.error('Error deleting worker', { error, id });
      throw error;
    }
  }

  async validatePassword(employeeId: string, password: string): Promise<Workers | null> {
    try {
      const worker = await prisma.workers.findUnique({
        where: { employee_id: employeeId },
      });

      if (!worker) return null;

      // Password validation will be handled in the service layer
      return worker;
    } catch (error) {
      logger.error('Error validating worker password', { error, employeeId });
      throw error;
    }
  }
}