import { AxiosInstance } from 'axios';
import { createApiClient } from '../utils/api-client.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type {
  CarrierShipmentResponse,
  CarrierShipmentRequest,
} from '../types/index.js';
import type { ShipmentStatus } from '../dtos/shipment.dto.js';

export class CarrierClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = createApiClient(env.CARRIER_API_URL, 'Carrier');
  }

  async getShipmentStatus(carrierRef: string): Promise<CarrierShipmentResponse> {
    logger.debug('Fetching shipment status from carrier', { carrierRef });
    const response = await this.client.get<CarrierShipmentResponse>(
      `/carrier/shipments/${carrierRef}`
    );
    return response.data;
  }

  async registerShipment(
    data: CarrierShipmentRequest
  ): Promise<CarrierShipmentResponse> {
    logger.debug('Registering shipment with carrier', { orderId: data.orderId });
    const response = await this.client.post<CarrierShipmentResponse>(
      '/carrier/shipments',
      data
    );
    return response.data;
  }

  async updateShipment(
    carrierRef: string,
    data: Partial<CarrierShipmentRequest>
  ): Promise<CarrierShipmentResponse> {
    logger.debug('Updating shipment with carrier', { carrierRef });
    const response = await this.client.patch<CarrierShipmentResponse>(
      `/carrier/shipments/${carrierRef}`,
      data
    );
    return response.data;
  }

  mapCarrierStatusToInternal(carrierStatus: string | undefined): ShipmentStatus {
    if (!carrierStatus) {
      return 'PENDING';
    }

    const statusMap: Record<string, ShipmentStatus> = {
      pending: 'PENDING',
      in_transit: 'IN_TRANSIT',
      in_progress: 'IN_TRANSIT',
      shipped: 'IN_TRANSIT',
      delivered: 'DELIVERED',
      completed: 'DELIVERED',
      failed: 'FAILED',
      cancelled: 'FAILED',
      error: 'FAILED',
    };

    const normalized = carrierStatus.toLowerCase().replace(/[-\s]/g, '_');
    return statusMap[normalized] || 'PENDING';
  }

  mapInternalStatusToCarrier(internalStatus: ShipmentStatus): string {
    const statusMap: Record<ShipmentStatus, string> = {
      PENDING: 'pending',
      IN_TRANSIT: 'in_transit',
      DELIVERED: 'delivered',
      FAILED: 'failed',
    };

    return statusMap[internalStatus];
  }
}

export const carrierClient = new CarrierClient();
