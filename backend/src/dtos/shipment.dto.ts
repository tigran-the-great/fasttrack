import { z } from 'zod';

export const shipmentStatusSchema = z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED']);

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid shipment ID format'),
});

export type IdParamDto = z.infer<typeof idParamSchema>;

export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;

export const createShipmentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required').max(50),
  customerName: z.string().min(1, 'Customer name is required').max(255),
  destination: z.string().min(1, 'Destination is required').max(500),
  status: shipmentStatusSchema.optional(),
});

export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;

export const updateShipmentSchema = z.object({
  customerName: z.string().min(1).max(255).optional(),
  destination: z.string().min(1).max(500).optional(),
  status: shipmentStatusSchema.optional(),
});

export type UpdateShipmentDto = z.infer<typeof updateShipmentSchema>;

export const syncRequestSchema = z.object({
  shipmentId: z.string().uuid().optional(),
});

export type SyncRequestDto = z.infer<typeof syncRequestSchema>;

export const queryShipmentsSchema = z.object({
  status: shipmentStatusSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type QueryShipmentsDto = z.infer<typeof queryShipmentsSchema>;

export interface ShipmentResponseDto {
  id: string;
  orderId: string;
  customerName: string;
  destination: string;
  status: ShipmentStatus;
  lastSyncedAt: Date | null;
  carrierRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SyncResultDto {
  synced: number;
  failed: number;
  errors: Array<{ shipmentId: string; error: string }>;
  duration: number;
}
