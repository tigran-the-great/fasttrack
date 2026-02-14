import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ShipmentService, shipmentService } from '../services/shipment.service.js';
import { SyncService, syncService } from '../services/sync.service.js';
import type {
  CreateShipmentDto,
  UpdateShipmentDto,
  QueryShipmentsDto,
  SyncRequestDto,
} from '../dtos/shipment.dto.js';

export class ShipmentController {
  constructor(
    private readonly service: ShipmentService = shipmentService,
    private readonly sync: SyncService = syncService
  ) {}

  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const query = req.query as unknown as QueryShipmentsDto;
      const result = await this.service.findAll(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const shipment = await this.service.findById(req.params.id);
      res.json({ data: shipment });
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request<unknown, unknown, CreateShipmentDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const shipment = await this.service.create(req.body);
      res.status(StatusCodes.CREATED).json({ data: shipment });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request<{ id: string }, unknown, UpdateShipmentDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const shipment = await this.service.update(req.params.id, req.body);
      res.json({ data: shipment });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await this.service.delete(req.params.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };

  triggerSync = async (
    req: Request<unknown, unknown, SyncRequestDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { shipmentId } = req.body;

      const result = shipmentId
        ? await this.sync.syncSingleShipment(shipmentId)
        : await this.sync.syncAllShipments();

      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}

export const shipmentController = new ShipmentController();
