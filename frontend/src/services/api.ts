import axios, { AxiosInstance } from 'axios';
import type {
  Shipment,
  CreateShipmentDto,
  UpdateShipmentDto,
  PaginatedResponse,
  SyncResult,
  ApiResponse,
} from '../types/shipment';

const API_URL = '/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getShipments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Shipment>> {
    const response = await this.client.get<PaginatedResponse<Shipment>>(
      '/shipments',
      { params }
    );
    return response.data;
  }

  async getShipment(id: string): Promise<Shipment> {
    const response = await this.client.get<ApiResponse<Shipment>>(
      `/shipments/${id}`
    );
    return response.data.data;
  }

  async createShipment(data: CreateShipmentDto): Promise<Shipment> {
    const response = await this.client.post<ApiResponse<Shipment>>(
      '/shipments',
      data
    );
    return response.data.data;
  }

  async updateShipment(id: string, data: UpdateShipmentDto): Promise<Shipment> {
    const response = await this.client.patch<ApiResponse<Shipment>>(
      `/shipments/${id}`,
      data
    );
    return response.data.data;
  }

  async deleteShipment(id: string): Promise<void> {
    await this.client.delete(`/shipments/${id}`);
  }

  async triggerSync(shipmentId?: string): Promise<SyncResult> {
    const response = await this.client.post<ApiResponse<SyncResult>>('/sync', {
      shipmentId,
    });
    return response.data.data;
  }
}

export const api = new ApiService();
