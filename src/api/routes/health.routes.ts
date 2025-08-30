import { Router } from 'express';
import { HealthController } from '@/api/controllers/health.controller';

const router = Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', healthController.health);

export { router as healthRoutes };

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
export const readyRouter = Router();
readyRouter.get('/', healthController.ready);