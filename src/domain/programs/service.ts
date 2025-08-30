import { ProgramRepository, ProgramFilter, ProgramWithRelations } from './repository';
import { PaginatedResponse } from '@/shared/types/api';
import { logger } from '@/infrastructure/logging/logger';
import { Prisma } from '@prisma/client';

export class ProgramService {
  constructor(private programRepository: ProgramRepository) {}

  async getProgramById(id: number): Promise<ProgramWithRelations | null> {
    return this.programRepository.findById(id);
  }

  async getPrograms(
    filter: ProgramFilter = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<ProgramWithRelations>> {
    const skip = (page - 1) * limit;
    const orderBy: Prisma.ProgramOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const { programs, total } = await this.programRepository.findMany(
      filter,
      { skip, take: limit },
      orderBy
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: programs,
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

  async createProgram(data: {
    work_year: number;
    required_quarter: string;
    title: string;
    description: string;
    requester_worker_id: number;
    department_id: number;
    domain_id: number;
    estimated_amount: number;
    currency: string;
    possible_suppliers: string;
    notes?: string;
    planning_source: 'Annual' | 'Unplanned' | 'CarryOver';
    complexity_level: number;
    engagement_type_id: number;
    status_key: string;
    assignee_worker_id?: number;
    start_required_month?: number;
    planning_comment?: string;
    assignee_comment?: string;
  }): Promise<ProgramWithRelations> {
    // Validate quarter format
    const quarterRegex = /^Q[1-4]\/[0-9]{2}$/;
    if (!quarterRegex.test(data.required_quarter)) {
      throw new Error('Invalid quarter format. Use Q1/24, Q2/24, etc.');
    }

    // Validate complexity level
    if (data.complexity_level < 1 || data.complexity_level > 3) {
      throw new Error('Complexity level must be between 1 and 3');
    }

    // Validate start required month
    if (data.start_required_month && (data.start_required_month < 1 || data.start_required_month > 12)) {
      throw new Error('Start required month must be between 1 and 12');
    }

    const createData: Prisma.ProgramCreateInput = {
      work_year: data.work_year,
      required_quarter: data.required_quarter,
      title: data.title,
      description: data.description,
      estimated_amount: new Prisma.Decimal(data.estimated_amount),
      currency: data.currency,
      possible_suppliers: data.possible_suppliers,
      notes: data.notes,
      planning_source: data.planning_source,
      complexity_level: data.complexity_level,
      start_required_month: data.start_required_month,
      planning_comment: data.planning_comment,
      assignee_comment: data.assignee_comment,
      requester_worker: { connect: { worker_id: data.requester_worker_id } },
      department: { connect: { department_id: data.department_id } },
      domain: { connect: { domain_id: data.domain_id } },
      engagement_type: { connect: { engagement_type_id: data.engagement_type_id } },
      status: { connect: { status_key: data.status_key } },
      ...(data.assignee_worker_id && {
        assignee_worker: { connect: { worker_id: data.assignee_worker_id } },
      }),
    };

    const program = await this.programRepository.create(createData);
    
    // Return with relations
    const programWithRelations = await this.programRepository.findById(program.program_id);
    if (!programWithRelations) {
      throw new Error('Failed to retrieve created program');
    }
    
    logger.info('Program created', { program_id: program.program_id, title: data.title });
    return programWithRelations;
  }

  async updateProgram(
    id: number,
    data: Partial<{
      work_year: number;
      required_quarter: string;
      title: string;
      description: string;
      department_id: number;
      domain_id: number;
      estimated_amount: number;
      currency: string;
      possible_suppliers: string;
      notes: string;
      planning_source: 'Annual' | 'Unplanned' | 'CarryOver';
      complexity_level: number;
      engagement_type_id: number;
      status_key: string;
      assignee_worker_id: number;
      start_required_month: number;
      planning_comment: string;
      assignee_comment: string;
    }>
  ): Promise<ProgramWithRelations> {
    // Validate quarter format if provided
    if (data.required_quarter) {
      const quarterRegex = /^Q[1-4]\/[0-9]{2}$/;
      if (!quarterRegex.test(data.required_quarter)) {
        throw new Error('Invalid quarter format. Use Q1/24, Q2/24, etc.');
      }
    }

    // Validate complexity level if provided
    if (data.complexity_level && (data.complexity_level < 1 || data.complexity_level > 3)) {
      throw new Error('Complexity level must be between 1 and 3');
    }

    // Validate start required month if provided
    if (data.start_required_month && (data.start_required_month < 1 || data.start_required_month > 12)) {
      throw new Error('Start required month must be between 1 and 12');
    }

    const updateData: Prisma.ProgramUpdateInput = {};

    if (data.work_year) updateData.work_year = data.work_year;
    if (data.required_quarter) updateData.required_quarter = data.required_quarter;
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.estimated_amount) updateData.estimated_amount = new Prisma.Decimal(data.estimated_amount);
    if (data.currency) updateData.currency = data.currency;
    if (data.possible_suppliers) updateData.possible_suppliers = data.possible_suppliers;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.planning_source) updateData.planning_source = data.planning_source;
    if (data.complexity_level) updateData.complexity_level = data.complexity_level;
    if (data.start_required_month !== undefined) updateData.start_required_month = data.start_required_month;
    if (data.planning_comment !== undefined) updateData.planning_comment = data.planning_comment;
    if (data.assignee_comment !== undefined) updateData.assignee_comment = data.assignee_comment;

    if (data.department_id) updateData.department = { connect: { department_id: data.department_id } };
    if (data.domain_id) updateData.domain = { connect: { domain_id: data.domain_id } };
    if (data.engagement_type_id) updateData.engagement_type = { connect: { engagement_type_id: data.engagement_type_id } };
    if (data.status_key) updateData.status = { connect: { status_key: data.status_key } };
    if (data.assignee_worker_id) updateData.assignee_worker = { connect: { worker_id: data.assignee_worker_id } };

    await this.programRepository.update(id, updateData);
    
    const updatedProgram = await this.programRepository.findById(id);
    if (!updatedProgram) {
      throw new Error('Failed to retrieve updated program');
    }
    
    logger.info('Program updated', { program_id: id });
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<void> {
    await this.programRepository.delete(id);
    logger.info('Program deleted', { program_id: id });
  }
}