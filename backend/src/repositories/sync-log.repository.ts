import { SyncLog, SyncType, SyncStatus } from '@prisma/client';
import { prisma } from '../config/database.js';

export interface CreateSyncLogDto {
  shipmentId?: string;
  syncType: SyncType;
  status: SyncStatus;
  errorMessage?: string;
  duration?: number;
}

export class SyncLogRepository {
  async create(dto: CreateSyncLogDto): Promise<SyncLog> {
    return prisma.syncLog.create({
      data: {
        shipmentId: dto.shipmentId,
        syncType: dto.syncType,
        status: dto.status,
        errorMessage: dto.errorMessage,
        duration: dto.duration,
      },
    });
  }

  async findByShipmentId(shipmentId: string, limit = 10): Promise<SyncLog[]> {
    return prisma.syncLog.findMany({
      where: { shipmentId },
      orderBy: { syncedAt: 'desc' },
      take: limit,
    });
  }

  async findRecent(limit = 50): Promise<SyncLog[]> {
    return prisma.syncLog.findMany({
      orderBy: { syncedAt: 'desc' },
      take: limit,
    });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.syncLog.deleteMany({
      where: {
        syncedAt: { lt: date },
      },
    });
    return result.count;
  }
}

export const syncLogRepository = new SyncLogRepository();
