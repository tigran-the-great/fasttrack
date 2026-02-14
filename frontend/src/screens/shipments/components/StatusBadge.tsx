import { memo, useMemo } from 'react';
import type { ShipmentStatus } from '../../../types/shipment';

interface StatusBadgeProps {
  status: ShipmentStatus;
}

const statusClassMap: Record<ShipmentStatus, string> = {
  PENDING: 'status-badge--pending',
  IN_TRANSIT: 'status-badge--in-transit',
  DELIVERED: 'status-badge--delivered',
  FAILED: 'status-badge--failed',
};

const statusLabels: Record<ShipmentStatus, string> = {
  PENDING: 'Pending',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};

export const StatusBadge = memo(({ status }: StatusBadgeProps) => {
  const className = useMemo(
    () => `status-badge ${statusClassMap[status]}`,
    [status]
  );

  return (
    <span className={className}>
      {statusLabels[status]}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
