import { Router } from 'express';
import { ProgramsController } from '@/api/controllers/programs.controller';
import { AuthMiddleware } from '@/api/middleware/auth';
import { validateBody, validateQuery } from '@/api/middleware/validation';
import { createProgramSchema, updateProgramSchema, paginationSchema } from '@/shared/validation/schemas';

const router = Router();
const programsController = new ProgramsController();
const authMiddleware = new AuthMiddleware();

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /programs:
 *   get:
 *     summary: Get all programs with filtering and pagination
 *     tags: [Programs]
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
 *         name: work_year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status_key
 *         schema:
 *           type: string
 *       - in: query
 *         name: domain_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Programs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', validateQuery(paginationSchema), programsController.getPrograms);

/**
 * @swagger
 * /programs/{id}:
 *   get:
 *     summary: Get program by ID
 *     tags: [Programs]
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
 *         description: Program retrieved successfully
 *       404:
 *         description: Program not found
 */
router.get('/:id', programsController.getProgramById);

/**
 * @swagger
 * /programs:
 *   post:
 *     summary: Create a new program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - work_year
 *               - required_quarter
 *               - title
 *               - description
 *               - requester_worker_id
 *               - department_id
 *               - domain_id
 *               - estimated_amount
 *               - currency
 *               - possible_suppliers
 *               - planning_source
 *               - complexity_level
 *               - engagement_type_id
 *               - status_key
 *     responses:
 *       201:
 *         description: Program created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', 
  authMiddleware.authorize(['create_program']), 
  validateBody(createProgramSchema), 
  programsController.createProgram
);

/**
 * @swagger
 * /programs/{id}:
 *   put:
 *     summary: Update program by ID
 *     tags: [Programs]
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
 *         description: Program updated successfully
 *       404:
 *         description: Program not found
 */
router.put('/:id', 
  authMiddleware.authorize(['update_program']), 
  validateBody(updateProgramSchema), 
  programsController.updateProgram
);

/**
 * @swagger
 * /programs/{id}:
 *   delete:
 *     summary: Delete program by ID
 *     tags: [Programs]
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
 *         description: Program deleted successfully
 *       404:
 *         description: Program not found
 */
router.delete('/:id', 
  authMiddleware.authorize(['delete_program']), 
  programsController.deleteProgram
);

export { router as programsRoutes };