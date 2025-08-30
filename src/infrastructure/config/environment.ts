import { logger } from '../logging/logger';

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
  CORS_ALLOWED_ORIGINS: string[];
  PUBLIC_URL: string;
  LOG_LEVEL: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    this.validateEnvironment();
    this.config = this.loadConfig();
  }

  private validateEnvironment(): void {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REFRESH_SECRET',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      logger.error('Missing required environment variables', { missingVars });
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate JWT secrets are not default/weak values
    if (process.env.JWT_SECRET === 'your-jwt-secret-here' || 
        process.env.REFRESH_SECRET === 'your-refresh-secret-here') {
      throw new Error('JWT secrets must be changed from default values');
    }

    // Validate JWT secrets are strong enough
    if (process.env.JWT_SECRET!.length < 32 || process.env.REFRESH_SECRET!.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters long');
    }
  }

  private loadConfig(): EnvironmentConfig {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000', 10),
      DATABASE_URL: process.env.DATABASE_URL!,
      JWT_SECRET: process.env.JWT_SECRET!,
      REFRESH_SECRET: process.env.REFRESH_SECRET!,
      ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
      REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d',
      CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:3000',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    };
  }

  get(): EnvironmentConfig {
    return this.config;
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }
}

export const environment = new Environment();
export type { EnvironmentConfig };