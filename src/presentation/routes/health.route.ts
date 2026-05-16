import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/ApiResponse';

export const healthRouter = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns the health status of the API server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res
    .status(200)
    .json(ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString() }, 'Healthy'));
});
