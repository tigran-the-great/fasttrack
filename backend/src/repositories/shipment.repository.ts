import { PrismaClient, Shipment, ShipmentStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import type {
  CreateShipmentDto,
  UpdateShipmentDto,
  QueryShipmentsDto,
} from '../dtos/shipment.dto.js';

export class ShipmentRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findAll(
    query: QueryShipmentsDto
  ): Promise<{ shipments: Shipment[]; total: number }> {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as ShipmentStatus } : {};

    const [shipments, total] = await Promise.all([
      this.db.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.shipment.count({ where }),
    ]);

    return { shipments, total };
  }

  async findById(id: string): Promise<Shipment | null> {
    return this.db.shipment.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    return this.db.shipment.findUnique({ where: { orderId } });
  }

  async findStaleShipments(thresholdMinutes: number = 5): Promise<Shipment[]> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    return this.db.shipment.findMany({
      where: {
        OR: [
          { lastSyncedAt: null },
          { lastSyncedAt: { lt: threshold } },
        ],
        status: { notIn: ['DELIVERED', 'FAILED'] },
      },
    });
  }

  async findAllForSync(): Promise<Shipment[]> {
    return this.db.shipment.findMany({
      where: {
        status: { notIn: ['DELIVERED', 'FAILED'] },
      },
    });
  }

  async create(data: CreateShipmentDto): Promise<Shipment> {
    return this.db.shipment.create({
      data: {
        orderId: data.orderId,
        customerName: data.customerName,
        destination: data.destination,
        status: (data.status as ShipmentStatus) || 'PENDING',
      },
    });
  }

  async update(id: string, data: UpdateShipmentDto): Promise<Shipment> {
    return this.db.shipment.update({
      where: { id },
      data: {
        ...(data.customerName && { customerName: data.customerName }),
        ...(data.destination && { destination: data.destination }),
        ...(data.status && { status: data.status as ShipmentStatus }),
      },
    });
  }

  async updateWithSync(
    id: string,
    status: ShipmentStatus,
    carrierRef?: string
  ): Promise<Shipment> {
    return this.db.shipment.update({
      where: { id },
      data: {
        status,
        lastSyncedAt: new Date(),
        ...(carrierRef && { carrierRef }),
        version: { increment: 1 },
      },
    });
  }

  async updateCarrierRef(id: string, carrierRef: string): Promise<Shipment> {
    return this.db.shipment.update({
      where: { id },
      data: { carrierRef },
    });
  }

  async delete(id: string): Promise<Shipment> {
    return this.db.shipment.delete({ where: { id } });
  }

  async updateWithOptimisticLock(
    id: string,
    data: Partial<Shipment>,
    expectedVersion: number
  ): Promise<Shipment | null> {
    const result = await this.db.shipment.updateMany({
      where: {
        id,
        version: expectedVersion,
      },
      data: {
        ...data,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }
}

export const shipmentRepository = new ShipmentRepository();
