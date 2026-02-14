import { memo, useCallback, useMemo } from 'react';
import { useSync } from '../hooks/useSync';
import { useToast } from './Toast';

interface SyncButtonProps {
  shipmentId?: string;
  onSyncComplete?: () => void;
}

export const SyncButton = memo(({ shipmentId, onSyncComplete }: SyncButtonProps) => {
  const { syncing, triggerSync } = useSync();
  const { showToast } = useToast();

  const handleSync = useCallback(async () => {
    const result = await triggerSync(shipmentId);
    if (result) {
      const { synced, failed, errors } = result;
      if (failed > 0 && errors?.length) {
        showToast(`Sync: ${synced} synced, ${failed} failed - ${errors[0].error}`, 'error');
      } else if (failed > 0) {
        showToast(`Sync: ${synced} synced, ${failed} failed`, 'error');
      } else {
        showToast(`Synced ${synced} shipment${synced !== 1 ? 's' : ''} successfully`, 'success');
      }
      onSyncComplete?.();
    } else {
      showToast('Sync failed', 'error');
    }
  }, [triggerSync, shipmentId, showToast, onSyncComplete]);

  const btnClass = useMemo(
    () => `btn btn--primary sync-btn ${syncing ? 'btn--loading' : ''}`,
    [syncing]
  );

  const label = useMemo(
    () => (shipmentId ? 'Sync' : 'Sync All'),
    [shipmentId]
  );

  return (
    <button onClick={handleSync} disabled={syncing} className={btnClass}>
      {syncing ? (
        <>
          <span className="spinner">↻</span>
          Syncing...
        </>
      ) : (
        <>↻ {label}</>
      )}
    </button>
  );
});

SyncButton.displayName = 'SyncButton';
