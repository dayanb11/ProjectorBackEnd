import { prisma } from './client';
import { logger } from '../logging/logger';
import * as argon2 from 'argon2';

async function seedDictionaries() {
  logger.info('Starting dictionary seeding...');

  // Seed Status Values
  const statusValues = [
    { status_key: 'DRAFT', display_label: 'Draft' },
    { status_key: 'SUBMITTED', display_label: 'Submitted' },
    { status_key: 'UNDER_REVIEW', display_label: 'Under Review' },
    { status_key: 'APPROVED', display_label: 'Approved' },
    { status_key: 'REJECTED', display_label: 'Rejected' },
    { status_key: 'IN_PROGRESS', display_label: 'In Progress' },
    { status_key: 'COMPLETED', display_label: 'Completed' },
    { status_key: 'CANCELLED', display_label: 'Cancelled' },
  ];

  for (const status of statusValues) {
    await prisma.statusValue.upsert({
      where: { status_key: status.status_key },
      update: { display_label: status.display_label },
      create: status,
    });
  }

  // Seed Structure Values
  const structureValues = [
    { structure_key: 'HIERARCHICAL', display_label: 'Hierarchical Structure' },
    { structure_key: 'MATRIX', display_label: 'Matrix Structure' },
    { structure_key: 'FLAT', display_label: 'Flat Structure' },
    { structure_key: 'NETWORK', display_label: 'Network Structure' },
  ];

  for (const structure of structureValues) {
    await prisma.structureValue.upsert({
      where: { structure_key: structure.structure_key },
      update: { display_label: structure.display_label },
      create: structure,
    });
  }

  // Seed Permissions
  const permissions = [
    { permission_key: 'READ_ALL', setting: 'Can read all data' },
    { permission_key: 'WRITE_ALL', setting: 'Can write all data' },
    { permission_key: 'DELETE_ALL', setting: 'Can delete all data' },
    { permission_key: 'ADMIN', setting: 'Full administrative access' },
    { permission_key: 'CREATE_WORKER', setting: 'Can create workers' },
    { permission_key: 'UPDATE_WORKER', setting: 'Can update workers' },
    { permission_key: 'DELETE_WORKER', setting: 'Can delete workers' },
    { permission_key: 'CREATE_PROGRAM', setting: 'Can create programs' },
    { permission_key: 'UPDATE_PROGRAM', setting: 'Can update programs' },
    { permission_key: 'DELETE_PROGRAM', setting: 'Can delete programs' },
  ];

  for (const permission of permissions) {
    await prisma.permissions.upsert({
      where: { permission_key: permission.permission_key },
      update: { setting: permission.setting },
      create: permission,
    });
  }

  // Seed Complexity Estimates
  const complexityEstimates = [
    {
      id: 1,
      estimate_level_1: 'Simple - Basic requirements, minimal complexity',
      estimate_level_2: 'Moderate - Standard requirements, some complexity',
      estimate_level_3: 'Complex - Advanced requirements, high complexity',
    },
  ];

  for (const estimate of complexityEstimates) {
    await prisma.complexityEstimate.upsert({
      where: { id: estimate.id },
      update: {
        estimate_level_1: estimate.estimate_level_1,
        estimate_level_2: estimate.estimate_level_2,
        estimate_level_3: estimate.estimate_level_3,
      },
      create: estimate,
    });
  }

  // Seed Acceptance Options
  const acceptanceOptions = [
    {
      year_key: '2024',
      acceptance_code: 'Plan' as const,
      code_meaning: 'Planned for execution',
      extended_meaning: 'This program is planned and scheduled for execution in the specified timeframe',
    },
    {
      year_key: '2024',
      acceptance_code: 'Late' as const,
      code_meaning: 'Late execution',
      extended_meaning: 'This program will be executed later than originally planned',
    },
    {
      year_key: '2024',
      acceptance_code: 'Block' as const,
      code_meaning: 'Blocked',
      extended_meaning: 'This program is blocked and cannot proceed at this time',
    },
    {
      year_key: '2024',
      acceptance_code: 'Finish' as const,
      code_meaning: 'Finished',
      extended_meaning: 'This program has been completed successfully',
    },
  ];

  for (const option of acceptanceOptions) {
    await prisma.acceptanceOption.upsert({
      where: { year_key: option.year_key },
      update: {
        acceptance_code: option.acceptance_code,
        code_meaning: option.code_meaning,
        extended_meaning: option.extended_meaning,
      },
      create: option,
    });
  }

  // Seed Organizational Roles
  const roles = [
    {
      role_description: 'Administrator',
      role_permissions: JSON.stringify(['*']), // All permissions
    },
    {
      role_description: 'Program Manager',
      role_permissions: JSON.stringify(['create_program', 'update_program', 'delete_program', 'read_all']),
    },
    {
      role_description: 'Team Lead',
      role_permissions: JSON.stringify(['create_program', 'update_program', 'read_all']),
    },
    {
      role_description: 'Worker',
      role_permissions: JSON.stringify(['read_all']),
    },
  ];

  for (const role of roles) {
    await prisma.organizationalRole.upsert({
      where: { role_description: role.role_description },
      update: { role_permissions: role.role_permissions },
      create: role,
    });
  }

  // Seed Divisions
  const divisions = [
    { division_name: 'Information Technology', is_internal: true },
    { division_name: 'Human Resources', is_internal: true },
    { division_name: 'Finance', is_internal: true },
    { division_name: 'Operations', is_internal: true },
    { division_name: 'External Consulting', is_internal: false },
  ];

  for (const division of divisions) {
    await prisma.division.upsert({
      where: { division_name: division.division_name },
      update: { is_internal: division.is_internal },
      create: division,
    });
  }

  // Seed Departments
  const itDivision = await prisma.division.findFirst({ where: { division_name: 'Information Technology' } });
  const hrDivision = await prisma.division.findFirst({ where: { division_name: 'Human Resources' } });
  const financeDivision = await prisma.division.findFirst({ where: { division_name: 'Finance' } });

  if (itDivision && hrDivision && financeDivision) {
    const departments = [
      { department_name: 'Software Development', division_id: itDivision.division_id },
      { department_name: 'Infrastructure', division_id: itDivision.division_id },
      { department_name: 'Recruitment', division_id: hrDivision.division_id },
      { department_name: 'Payroll', division_id: hrDivision.division_id },
      { department_name: 'Accounting', division_id: financeDivision.division_id },
      { department_name: 'Procurement', division_id: financeDivision.division_id },
    ];

    for (const department of departments) {
      await prisma.department.upsert({
        where: { department_name: department.department_name },
        update: { division_id: department.division_id },
        create: department,
      });
    }
  }

  // Seed Procurement Teams
  const teams = [
    { team_name: 'IT Procurement Team' },
    { team_name: 'General Procurement Team' },
    { team_name: 'Strategic Procurement Team' },
  ];

  for (const team of teams) {
    await prisma.procurementTeam.upsert({
      where: { team_name: team.team_name },
      update: {},
      create: team,
    });
  }

  // Seed Activity Pool
  const activities = [
    { activity_name: 'Requirements Analysis', activity_aids: 'Documentation templates, stakeholder interviews' },
    { activity_name: 'Vendor Research', activity_aids: 'Market research tools, vendor databases' },
    { activity_name: 'RFP Preparation', activity_aids: 'RFP templates, legal review' },
    { activity_name: 'Proposal Evaluation', activity_aids: 'Scoring matrices, evaluation criteria' },
    { activity_name: 'Contract Negotiation', activity_aids: 'Legal support, contract templates' },
    { activity_name: 'Implementation Planning', activity_aids: 'Project management tools, timelines' },
    { activity_name: 'Quality Assurance', activity_aids: 'Testing protocols, acceptance criteria' },
    { activity_name: 'Final Review', activity_aids: 'Approval workflows, documentation' },
  ];

  for (const activity of activities) {
    await prisma.activityPool.upsert({
      where: { activity_name: activity.activity_name },
      update: { activity_aids: activity.activity_aids },
      create: activity,
    });
  }

  // Seed Engagement Types
  const engagementTypes = [
    { engagement_type_name: 'Software Procurement' },
    { engagement_type_name: 'Hardware Procurement' },
    { engagement_type_name: 'Service Procurement' },
    { engagement_type_name: 'Consulting Engagement' },
    { engagement_type_name: 'Maintenance Contract' },
  ];

  for (const engagementType of engagementTypes) {
    await prisma.engagementType.upsert({
      where: { engagement_type_name: engagementType.engagement_type_name },
      update: {},
      create: engagementType,
    });
  }

  // Seed Domains
  const domains = [
    { domain_name: 'Information Technology' },
    { domain_name: 'Human Resources' },
    { domain_name: 'Finance & Accounting' },
    { domain_name: 'Operations' },
    { domain_name: 'Marketing' },
    { domain_name: 'Legal & Compliance' },
  ];

  for (const domain of domains) {
    await prisma.domain.upsert({
      where: { domain_name: domain.domain_name },
      update: {},
      create: domain,
    });
  }

  logger.info('Dictionary seeding completed successfully');
}

async function seedTestData() {
  logger.info('Starting test data seeding...');

  // Create a test admin user
  const adminRole = await prisma.organizationalRole.findFirst({
    where: { role_description: 'Administrator' }
  });
  
  const itDivision = await prisma.division.findFirst({
    where: { division_name: 'Information Technology' }
  });
  
  const softwareDept = await prisma.department.findFirst({
    where: { department_name: 'Software Development' }
  });
  
  const itTeam = await prisma.procurementTeam.findFirst({
    where: { team_name: 'IT Procurement Team' }
  });

  if (adminRole && itDivision && softwareDept && itTeam) {
    const adminPassword = await argon2.hash('admin123!');
    
    await prisma.workers.upsert({
      where: { employee_id: 'ADMIN001' },
      update: {},
      create: {
        employee_id: 'ADMIN001',
        full_name: 'System Administrator',
        job_description: 'System Administrator with full access',
        division_id: itDivision.division_id,
        department_id: softwareDept.department_id,
        team_id: itTeam.team_id,
        role_id: adminRole.role_id,
        password_hash: adminPassword,
        available_work_days: 5,
        email: 'admin@projector.com',
      },
    });

    logger.info('Test admin user created: ADMIN001 / admin123!');
  }

  logger.info('Test data seeding completed successfully');
}

async function main() {
  try {
    await seedDictionaries();
    
    if (process.env.NODE_ENV === 'development') {
      await seedTestData();
    }
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Seeding script failed', { error });
    process.exit(1);
  });
}