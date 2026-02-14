import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { Shipment, ShipmentStatus, PaginatedResponse } from '../types/shipment';

interface UseShipmentsOptions {
  status?: ShipmentStatus;
  page?: number;
  limit?: number;
}

interface UseShipmentsReturn {
  shipments: Shipment[];
  meta: PaginatedResponse<Shipment>['meta'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useShipments = (options: UseShipmentsOptions = {}): UseShipmentsReturn => {
  const { status, page = 1, limit = 20 } = options;
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Shipment>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchShipments = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const response = await api.getShipments({ status, page, limit });
      setShipments(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [status, page, limit]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return { shipments, meta, loading, error, refetch: fetchShipments };
};
