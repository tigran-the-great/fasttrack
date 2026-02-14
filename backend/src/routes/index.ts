import { Router } from 'express';
import { shipmentRoutes } from './shipment.routes.js';
import { shipmentController } from '../controllers/shipment.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { syncRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { syncRequestSchema } from '../dtos/shipment.dto.js';

const router = Router();

router.use('/shipments', shipmentRoutes);

router.post(
  '/sync',
  syncRateLimiter,
  validateBody(syncRequestSchema),
  shipmentController.triggerSync
);

export { router };
