import { prisma } from '../db/client';
import { logger } from '../logging/logger';
import * as argon2 from 'argon2';

export async function validatePasswordSecurity(): Promise<void> {
  try {
    logger.info('Validating password security...');

    // Check for any plaintext passwords in the database
    const workers = await prisma.workers.findMany({
      select: {
        worker_id: true,
        employee_id: true,
        password_hash: true,
      },
    });

    for (const worker of workers) {
      // Check if password looks like plaintext (not hashed)
      if (!worker.password_hash.startsWith('$argon2') && !worker.password_hash.startsWith('$2b$')) {
        logger.error('Plaintext password detected', { 
          worker_id: worker.worker_id, 
          employee_id: worker.employee_id 
        });
        throw new Error(`SECURITY VIOLATION: Plaintext password detected for worker ${worker.employee_id}. All passwords must be hashed.`);
      }
    }

    logger.info('Password security validation completed successfully', { 
      workersChecked: workers.length 
    });
  } catch (error) {
    logger.error('Password security validation failed', { error });
    throw error;
  }
}

export async function validateEnvironmentSecurity(): Promise<void> {
  try {
    logger.info('Validating environment security...');

    // Check JWT secrets
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_SECRET;

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT_SECRET and REFRESH_SECRET must be provided');
    }

    if (jwtSecret.length < 32 || refreshSecret.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters long');
    }

    if (jwtSecret === refreshSecret) {
      throw new Error('JWT_SECRET and REFRESH_SECRET must be different');
    }

    // Check for default/weak secrets
    const weakSecrets = [
      'your-jwt-secret-here',
      'your-refresh-secret-here',
      'secret',
      'password',
      '123456',
      'admin',
    ];

    if (weakSecrets.includes(jwtSecret) || weakSecrets.includes(refreshSecret)) {
      throw new Error('JWT secrets must not use default or weak values');
    }

    // Validate database URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be provided');
    }

    if (databaseUrl.includes('password') && !databaseUrl.includes('sslmode=require')) {
      logger.warn('Database connection may not be using SSL');
    }

    logger.info('Environment security validation completed successfully');
  } catch (error) {
    logger.error('Environment security validation failed', { error });
    throw error;
  }
}