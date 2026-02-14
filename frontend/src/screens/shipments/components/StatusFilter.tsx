import { memo, useCallback, ChangeEvent } from 'react';
import type { ShipmentStatus } from '../../../types/shipment';

interface StatusFilterProps {
  value: ShipmentStatus | '';
  onChange: (status: ShipmentStatus | '') => void;
}

export const StatusFilter = memo(({ value, onChange }: StatusFilterProps) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value as ShipmentStatus | '');
    },
    [onChange]
  );

  return (
    <select value={value} onChange={handleChange} className="form-select">
      <option value="">All Statuses</option>
      <option value="PENDING">Pending</option>
      <option value="IN_TRANSIT">In Transit</option>
      <option value="DELIVERED">Delivered</option>
      <option value="FAILED">Failed</option>
    </select>
  );
});

StatusFilter.displayName = 'StatusFilter';
