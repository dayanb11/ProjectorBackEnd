import { DatabaseClient } from '../db/client';
import { logger } from '../logging/logger';

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database...');

    // Connect to database
    await DatabaseClient.connect();
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed', { error });
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function validateDatabaseSchema(): Promise<void> {
  try {
    logger.info('Validating database schema...');
    
    const client = DatabaseClient.getInstance();
    
    // Test basic connectivity and schema
    await client.$queryRaw`SELECT 1 as test`;
    
    // Validate that all required tables exist (tables are pre-created)
    const tables = await client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    const requiredTables = [
      'status_value',
      'structure_value', 
      'permissions',
      'complexity_estimate',
      'acceptance_option',
      'organizational_role',
      'division',
      'department',
      'procurement_team',
      'activity_pool',
      'engagement_type',
      'engagement_type_process',
      'domain',
      'workers',
      'program',
      'program_task'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }
    
    logger.info('Database schema validation completed successfully', { 
      tablesFound: existingTables.length 
    });
  } catch (e) {
     const err = e instanceof Error ? e : new Error(String(e));
   
      logger.error('Database schema validation failed', { message: err.message, stack: err.stack });
  throw err;

   
  }
}