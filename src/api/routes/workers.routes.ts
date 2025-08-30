import { Router } from 'express';
import { WorkersController } from '@/api/controllers/workers.controller';
import { AuthMiddleware } from '@/api/middleware/auth';
import { validateBody, validateQuery } from '@/api/middleware/validation';
import { createWorkerSchema, updateWorkerSchema, paginationSchema } from '@/shared/validation/schemas';

const router = Router();
const workersController = new WorkersController();
const authMiddleware = new AuthMiddleware();

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /workers:
 *   get:
 *     summary: Get all workers with filtering and pagination
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: full_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: division_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Workers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', validateQuery(paginationSchema), workersController.getWorkers);

/**
 * @swagger
 * /workers/{id}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Worker retrieved successfully
 *       404:
 *         description: Worker not found
 */
router.get('/:id', workersController.getWorkerById);

/**
 * @swagger
 * /workers:
 *   post:
 *     summary: Create a new worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - full_name
 *               - job_description
 *               - division_id
 *               - department_id
 *               - team_id
 *               - role_id
 *               - password
 *               - email
 *     responses:
 *       201:
 *         description: Worker created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', 
  authMiddleware.authorize(['create_worker']), 
  validateBody(createWorkerSchema), 
  workersController.createWorker
);

/**
 * @swagger
 * /workers/{id}:
 *   put:
 *     summary: Update worker by ID
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Worker updated successfully
 *       404:
 *         description: Worker not found
 */
router.put('/:id', 
  authMiddleware.authorize(['update_worker']), 
  validateBody(updateWorkerSchema), 
  workersController.updateWorker
);

/**
 * @swagger
 * /workers/{id}:
 *   delete:
 *     summary: Delete worker by ID
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Worker deleted successfully
 *       404:
 *         description: Worker not found
 */
router.delete('/:id', 
  authMiddleware.authorize(['delete_worker']), 
  workersController.deleteWorker
);

export { router as workersRoutes };