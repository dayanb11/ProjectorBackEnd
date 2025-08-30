import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../logging/logger';

// Singleton Prisma client with connection pooling and retry logic
class DatabaseClient {
  private static instance: PrismaClient | null = null;
  private static isConnected = false;

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Add logging middleware
      DatabaseClient.instance.$on('query', (e) => {
        logger.debug('Query executed', {
          query: e.query,
          params: e.params,
          duration: e.duration,
        });
      });

      DatabaseClient.instance.$on('error', (e) => {
        logger.error('Database error', { error: e });
      });

      // Add audit middleware for created_by and updated_by
      DatabaseClient.instance.$use(async (params, next) => {
        const userId = params.args?.userId;
        
        if (params.action === 'create') {
          if (params.args.data) {
            params.args.data.created_by = userId;
            params.args.data.updated_by = userId;
          }
        }
        
        if (params.action === 'update' || params.action === 'upsert') {
          if (params.args.data) {
            params.args.data.updated_by = userId;
          }
        }
        
        return next(params);
      });

      // Add soft delete middleware
      DatabaseClient.instance.$use(async (params, next) => {
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deleted_at: new Date() };
        }
        
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data.deleted_at = new Date();
          } else {
            params.args.data = { deleted_at: new Date() };
          }
        }
        
        return next(params);
      });

      // Add filter for soft deleted records
      DatabaseClient.instance.$use(async (params, next) => {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.args.where = { ...params.args.where, deleted_at: null };
        }
        
        if (params.action === 'findMany') {
          if (params.args.where) {
            if (params.args.where.deleted_at === undefined) {
              params.args.where.deleted_at = null;
            }
          } else {
            params.args.where = { deleted_at: null };
          }
        }
        
        return next(params);
      });
    }

    return DatabaseClient.instance;
  }

  public static async connect(): Promise<void> {
    if (DatabaseClient.isConnected) return;

    try {
      const client = DatabaseClient.getInstance();
      await client.$connect();
      DatabaseClient.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance && DatabaseClient.isConnected) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.isConnected = false;
      logger.info('Database disconnected');
    }
  }

  // Typed transaction helper
  public static async withTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    const client = DatabaseClient.getInstance();
    return client.$transaction(fn, {
      maxWait: 5000,
      timeout: 10000,
    });
  }
}

export const prisma = DatabaseClient.getInstance();
export { DatabaseClient };