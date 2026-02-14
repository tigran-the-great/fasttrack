export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface Shipment {
  id: string;
  orderId: string;
  customerName: string;
  destination: string;
  status: ShipmentStatus;
  lastSyncedAt: string | null;
  carrierRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  orderId: string;
  customerName: string;
  destination: string;
  status?: ShipmentStatus;
}

export interface UpdateShipmentDto {
  customerName?: string;
  destination?: string;
  status?: ShipmentStatus;
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

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ shipmentId: string; error: string }>;
  duration: number;
}

export interface ApiResponse<T> {
  data: T;
}
