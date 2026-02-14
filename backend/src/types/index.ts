import type { Request } from 'express';

export interface RequestWithId extends Request {
  headers: Request['headers'] & {
    'x-request-id'?: string;
  };
}

export interface CarrierShipmentResponse {
  id: string;
  orderId: string;
  status: string;
  location?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  updatedAt: string;
}

export interface CarrierShipmentRequest {
  orderId: string;
  customerName: string;
  destination: string;
  status?: string;
}

export interface ConflictResolution {
  source: 'carrier' | 'local' | 'none';
  status: string;
  shouldUpdate: boolean;
  shouldPushToCarrier: boolean;
}
