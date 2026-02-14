import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useShipments } from './useShipments';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getShipments: vi.fn(),
  },
}));

describe('useShipments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch shipments on mount', async () => {
    const mockResponse = {
      data: [{ id: '1', orderId: 'ORD-001', status: 'PENDING' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    vi.mocked(api.getShipments).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useShipments());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shipments).toEqual(mockResponse.data);
    expect(result.current.meta).toEqual(mockResponse.meta);
    expect(result.current.error).toBeNull();
  });

  it('should fetch shipments with status filter', async () => {
    const mockResponse = {
      data: [{ id: '1', orderId: 'ORD-001', status: 'IN_TRANSIT' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(api.getShipments).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useShipments({ status: 'IN_TRANSIT', page: 1, limit: 10 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.getShipments).toHaveBeenCalledWith({
      status: 'IN_TRANSIT',
      page: 1,
      limit: 10,
    });
    expect(result.current.shipments).toEqual(mockResponse.data);
  });

  it('should handle fetch error', async () => {
    const error = new Error('Network error');
    vi.mocked(api.getShipments).mockRejectedValue(error);

    const { result } = renderHook(() => useShipments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.shipments).toEqual([]);
  });

  it('should handle non-Error rejection', async () => {
    vi.mocked(api.getShipments).mockRejectedValue('string error');

    const { result } = renderHook(() => useShipments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch shipments');
  });

  it('should refetch shipments when refetch is called', async () => {
    const mockResponse1 = {
      data: [{ id: '1', orderId: 'ORD-001' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    const mockResponse2 = {
      data: [{ id: '1', orderId: 'ORD-001' }, { id: '2', orderId: 'ORD-002' }],
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    };

    vi.mocked(api.getShipments)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useShipments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shipments).toHaveLength(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.shipments).toHaveLength(2);
    expect(api.getShipments).toHaveBeenCalledTimes(2);
  });

  it('should use default pagination values', async () => {
    const mockResponse = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    vi.mocked(api.getShipments).mockResolvedValue(mockResponse);

    renderHook(() => useShipments());

    await waitFor(() => {
      expect(api.getShipments).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        limit: 20,
      });
    });
  });
});
