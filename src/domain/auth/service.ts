import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/infrastructure/db/client';
import { WorkersService } from '@/domain/workers/service';
import { JWTPayload, LoginResponse, RefreshResponse } from '@/shared/types/auth';
import { logger } from '@/infrastructure/logging/logger';

export class AuthService {
  private jwtSecret: string;
  private refreshSecret: string;
  private accessTokenTTL: string;
  private refreshTokenTTL: string;

  constructor(private workersService: WorkersService) {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.refreshSecret = process.env.REFRESH_SECRET!;
    this.accessTokenTTL = process.env.ACCESS_TOKEN_TTL || '15m';
    this.refreshTokenTTL = process.env.REFRESH_TOKEN_TTL || '7d';

    if (!this.jwtSecret || !this.refreshSecret) {
      throw new Error('JWT_SECRET and REFRESH_SECRET must be provided');
    }
  }

  async login(employeeId: string, password: string): Promise<LoginResponse> {
    // Validate credentials
    const worker = await this.workersService.validateCredentials(employeeId, password);
    
    if (!worker) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const jti = uuidv4();
    const accessToken = this.generateAccessToken(worker, jti);
    const refreshToken = await this.generateRefreshToken(worker.worker_id, jti);

    logger.info('User logged in successfully', { 
      worker_id: worker.worker_id, 
      employee_id: employeeId 
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        worker_id: worker.worker_id,
        employee_id: worker.employee_id,
        full_name: worker.full_name,
        email: worker.email,
        role: worker.role.role_description,
      },
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      
      // Find refresh token in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { jti: decoded.jti },
        include: { worker: true },
      });

      if (!storedToken || storedToken.expires_at < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Verify token hash
      const isValidToken = await argon2.verify(storedToken.token_hash, refreshToken);
      if (!isValidToken) {
        throw new Error('Invalid refresh token');
      }

      // Get worker with relations
      const worker = await this.workersService.getWorkerById(storedToken.worker_id);
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Generate new tokens
      const newJti = uuidv4();
      const newAccessToken = this.generateAccessToken(worker, newJti);
      const newRefreshToken = await this.generateRefreshToken(worker.worker_id, newJti);

      // Remove old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      logger.info('Tokens refreshed successfully', { worker_id: worker.worker_id });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      logger.error('Error refreshing token', { error });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      
      await prisma.refreshToken.deleteMany({
        where: { jti: decoded.jti },
      });

      logger.info('User logged out successfully', { jti: decoded.jti });
    } catch (error) {
      logger.error('Error during logout', { error });
      // Don't throw error for logout - just log it
    }
  }

  private generateAccessToken(worker: any, jti: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      user_id: worker.worker_id,
      employee_id: worker.employee_id,
      role: worker.role.role_description,
      jti,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenTTL,
    });
  }

  private async generateRefreshToken(workerId: number, jti: string): Promise<string> {
    const refreshToken = jwt.sign({ jti }, this.refreshSecret, {
      expiresIn: this.refreshTokenTTL,
    });

    // Hash the refresh token before storing
    const tokenHash = await argon2.hash(refreshToken);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token_hash: tokenHash,
        worker_id: workerId,
        jti,
        expires_at: expiresAt,
      },
    });

    return refreshToken;
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}