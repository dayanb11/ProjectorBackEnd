import { prisma } from '@/infrastructure/db/client';
import { Program, Prisma } from '@prisma/client';
import { logger } from '@/infrastructure/logging/logger';

export interface ProgramFilter {
  work_year?: number;
  required_quarter?: string;
  title?: string;
  status_key?: string;
  domain_id?: number;
  engagement_type_id?: number;
  department_id?: number;
  assignee_worker_id?: number;
  requester_worker_id?: number;
  planning_source?: string;
  complexity_level?: number;
}

export interface ProgramWithRelations extends Program {
  requester_worker: {
    worker_id: number;
    employee_id: string;
    full_name: string;
    email: string;
  };
  assignee_worker?: {
    worker_id: number;
    employee_id: string;
    full_name: string;
    email: string;
  } | null;
  department: {
    department_id: number;
    department_name: string;
    division: {
      division_id: number;
      division_name: string;
    };
  };
  domain: {
    domain_id: number;
    domain_name: string;
  };
  engagement_type: {
    engagement_type_id: number;
    engagement_type_name: string;
  };
  status: {
    status_key: string;
    display_label: string;
  };
  program_tasks: Array<{
    station_id: number;
    activity_id: number;
    is_last_station: boolean;
    completed_on: Date | null;
    reference: string | null;
    station_note: string | null;
    activity: {
      activity_id: number;
      activity_name: string;
    };
  }>;
}

export class ProgramRepository {
  async findById(id: number): Promise<ProgramWithRelations | null> {
    try {
      return await prisma.program.findUnique({
        where: { program_id: id },
        include: {
          requester_worker: {
            select: {
              worker_id: true,
              employee_id: true,
              full_name: true,
              email: true,
            },
          },
          assignee_worker: {
            select: {
              worker_id: true,
              employee_id: true,
              full_name: true,
              email: true,
            },
          },
          department: {
            include: {
              division: true,
            },
          },
          domain: true,
          engagement_type: true,
          status: true,
          program_tasks: {
            include: {
              activity: {
                select: {
                  activity_id: true,
                  activity_name: true,
                },
              },
            },
            orderBy: { station_id: 'asc' },
          },
        },
      });
    } catch (error) {
      logger.error('Error finding program by ID', { error, id });
      throw error;
    }
  }

  async findMany(
    filter: ProgramFilter = {},
    pagination: { skip: number; take: number },
    orderBy?: Prisma.ProgramOrderByWithRelationInput
  ): Promise<{ programs: ProgramWithRelations[]; total: number }> {
    try {
      const where: Prisma.ProgramWhereInput = {
        ...(filter.work_year && { work_year: filter.work_year }),
        ...(filter.required_quarter && { required_quarter: filter.required_quarter }),
        ...(filter.title && { title: { contains: filter.title, mode: 'insensitive' } }),
        ...(filter.status_key && { status_key: filter.status_key }),
        ...(filter.domain_id && { domain_id: filter.domain_id }),
        ...(filter.engagement_type_id && { engagement_type_id: filter.engagement_type_id }),
        ...(filter.department_id && { department_id: filter.department_id }),
        ...(filter.assignee_worker_id && { assignee_worker_id: filter.assignee_worker_id }),
        ...(filter.requester_worker_id && { requester_worker_id: filter.requester_worker_id }),
        ...(filter.planning_source && { planning_source: filter.planning_source as any }),
        ...(filter.complexity_level && { complexity_level: filter.complexity_level }),
      };

      const [programs, total] = await Promise.all([
        prisma.program.findMany({
          where,
          include: {
            requester_worker: {
              select: {
                worker_id: true,
                employee_id: true,
                full_name: true,
                email: true,
              },
            },
            assignee_worker: {
              select: {
                worker_id: true,
                employee_id: true,
                full_name: true,
                email: true,
              },
            },
            department: {
              include: {
                division: true,
              },
            },
            domain: true,
            engagement_type: true,
            status: true,
            program_tasks: {
              include: {
                activity: {
                  select: {
                    activity_id: true,
                    activity_name: true,
                  },
                },
              },
              orderBy: { station_id: 'asc' },
            },
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: orderBy || { created_at: 'desc' },
        }),
        prisma.program.count({ where }),
      ]);

      return { programs, total };
    } catch (error) {
      logger.error('Error finding programs', { error, filter, pagination });
      throw error;
    }
  }

  async create(data: Prisma.ProgramCreateInput): Promise<Program> {
    try {
      return await prisma.program.create({ data });
    } catch (error) {
      logger.error('Error creating program', { error, data });
      throw error;
    }
  }

  async update(id: number, data: Prisma.ProgramUpdateInput): Promise<Program> {
    try {
      return await prisma.program.update({
        where: { program_id: id },
        data: {
          ...data,
          last_updated: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating program', { error, id, data });
      throw error;
    }
  }

  async delete(id: number): Promise<Program> {
    try {
      return await prisma.program.delete({
        where: { program_id: id },
      });
    } catch (error) {
      logger.error('Error deleting program', { error, id });
      throw error;
    }
  }
}