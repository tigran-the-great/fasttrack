import { useState } from 'react';
import { api } from '../services/api';
import type { SyncResult } from '../types/shipment';

interface UseSyncReturn {
  syncing: boolean;
  result: SyncResult | null;
  error: string | null;
  triggerSync: (shipmentId?: string) => Promise<SyncResult | null>;
}

export const useSync = (): UseSyncReturn => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = async (shipmentId?: string): Promise<SyncResult | null> => {
    try {
      setSyncing(true);
      setError(null);
      const syncResult = await api.triggerSync(shipmentId);
      setResult(syncResult);
      return syncResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      return null;
    } finally {
      setSyncing(false);
    }
  };

  return { syncing, result, error, triggerSync };
};
