import { Shipment } from '@prisma/client';
import { ShipmentRepository, shipmentRepository } from '../repositories/shipment.repository.js';
import { CarrierClient, carrierClient } from '../external/carrier.client.js';
import { logger } from '../config/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import type {
  CreateShipmentDto,
  UpdateShipmentDto,
  QueryShipmentsDto,
  ShipmentResponseDto,
  PaginatedResponse,
} from '../dtos/shipment.dto.js';

export class ShipmentService {
  constructor(
    private readonly repository: ShipmentRepository = shipmentRepository,
    private readonly carrier: CarrierClient = carrierClient
  ) {}

  async findAll(query: QueryShipmentsDto): Promise<PaginatedResponse<ShipmentResponseDto>> {
    const { shipments, total } = await this.repository.findAll(query);

    return {
      data: shipments.map(this.mapToResponse),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string): Promise<ShipmentResponseDto> {
    const shipment = await this.repository.findById(id);

    if (!shipment) {
      throw new NotFoundError('Shipment', id);
    }

    return this.mapToResponse(shipment);
  }

  async create(dto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const existing = await this.repository.findByOrderId(dto.orderId);

    if (existing) {
      throw new ConflictError(`Shipment with order ID '${dto.orderId}' already exists`);
    }

    logger.info('Creating shipment', { orderId: dto.orderId });

    const shipment = await this.repository.create(dto);

    try {
      const carrierResponse = await this.carrier.registerShipment({
        orderId: dto.orderId,
        customerName: dto.customerName,
        destination: dto.destination,
        status: dto.status,
      });

      await this.repository.updateCarrierRef(shipment.id, carrierResponse.id);
      shipment.carrierRef = carrierResponse.id;

      logger.info('Shipment registered with carrier', {
        shipmentId: shipment.id,
        carrierRef: carrierResponse.id,
      });
    } catch (error) {
      logger.warn('Failed to register shipment with carrier', {
        shipmentId: shipment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return this.mapToResponse(shipment);
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<ShipmentResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError('Shipment', id);
    }

    logger.info('Updating shipment', { shipmentId: id, updates: dto });

    const shipment = await this.repository.update(id, dto);

    if (existing.carrierRef && dto.status) {
      try {
        await this.carrier.updateShipment(existing.carrierRef, {
          status: this.carrier.mapInternalStatusToCarrier(dto.status),
        });
        logger.info('Shipment updated with carrier', { shipmentId: id });
      } catch (error) {
        logger.warn('Failed to update shipment with carrier', {
          shipmentId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return this.mapToResponse(shipment);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError('Shipment', id);
    }

    logger.info('Deleting shipment', { shipmentId: id });

    await this.repository.delete(id);
  }

  private mapToResponse(shipment: Shipment): ShipmentResponseDto {
    return {
      id: shipment.id,
      orderId: shipment.orderId,
      customerName: shipment.customerName,
      destination: shipment.destination,
      status: shipment.status,
      lastSyncedAt: shipment.lastSyncedAt,
      carrierRef: shipment.carrierRef,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }
}

export const shipmentService = new ShipmentService();
