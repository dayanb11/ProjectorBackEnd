import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Worker schemas
export const createWorkerSchema = z.object({
  employee_id: z.string().min(1).max(50),
  full_name: z.string().min(1).max(255),
  job_description: z.string().min(1),
  division_id: z.number().int().positive(),
  department_id: z.number().int().positive(),
  team_id: z.number().int().positive(),
  role_id: z.number().int().positive(),
  password: z.string().min(8),
  available_work_days: z.number().int().min(1).max(7).default(5),
  email: z.string().email().max(255),
});

export const updateWorkerSchema = createWorkerSchema.partial().omit({ employee_id: true });

// Program schemas
export const createProgramSchema = z.object({
  work_year: z.number().int().min(2020).max(2050),
  required_quarter: z.string().regex(/^Q[1-4]\/[0-9]{2}$/, 'Invalid quarter format. Use Q1/24, Q2/24, etc.'),
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  requester_worker_id: z.number().int().positive(),
  department_id: z.number().int().positive(),
  domain_id: z.number().int().positive(),
  estimated_amount: z.number().positive(),
  currency: z.string().length(3),
  possible_suppliers: z.string().min(1),
  notes: z.string().optional(),
  planning_source: z.enum(['Annual', 'Unplanned', 'CarryOver']),
  complexity_level: z.number().int().min(1).max(3),
  engagement_type_id: z.number().int().positive(),
  status_key: z.string().min(1).max(50),
  assignee_worker_id: z.number().int().positive().optional(),
  start_required_month: z.number().int().min(1).max(12).optional(),
  planning_comment: z.string().optional(),
  assignee_comment: z.string().optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

// Program Task schemas
export const createProgramTaskSchema = z.object({
  program_id: z.number().int().positive(),
  station_id: z.number().int().min(1).max(10),
  activity_id: z.number().int().positive(),
  is_last_station: z.boolean().default(false),
  completed_on: z.string().datetime().optional(),
  reference: z.string().optional(),
  station_note: z.string().optional(),
  reporting_user_id: z.number().int().positive(),
});

export const updateProgramTaskSchema = createProgramTaskSchema.partial().omit({ 
  program_id: true, 
  station_id: true 
});