import { Router } from 'express';
import { shipmentController } from '../controllers/shipment.controller.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../middlewares/validate.middleware.js';
import {
  readRateLimiter,
  writeRateLimiter,
} from '../middlewares/rate-limit.middleware.js';
import {
  createShipmentSchema,
  updateShipmentSchema,
  queryShipmentsSchema,
  idParamSchema,
} from '../dtos/shipment.dto.js';

const router = Router();

router.get(
  '/',
  readRateLimiter,
  validateQuery(queryShipmentsSchema),
  shipmentController.findAll
);

router.get(
  '/:id',
  readRateLimiter,
  validateParams(idParamSchema),
  shipmentController.findById
);

router.post(
  '/',
  writeRateLimiter,
  validateBody(createShipmentSchema),
  shipmentController.create
);

router.patch(
  '/:id',
  writeRateLimiter,
  validateParams(idParamSchema),
  validateBody(updateShipmentSchema),
  shipmentController.update
);

router.delete(
  '/:id',
  writeRateLimiter,
  validateParams(idParamSchema),
  shipmentController.delete
);

export const shipmentRoutes = router;
