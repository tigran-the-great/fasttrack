import { memo, useCallback, useMemo } from 'react';
import { StatusBadge } from './StatusBadge';
import type { Shipment } from '../../../types/shipment';

interface ShipmentTableProps {
  shipments: Shipment[];
  onEdit: (shipment: Shipment) => void;
  onDelete: (shipment: Shipment) => void;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

interface ShipmentRowProps {
  shipment: Shipment;
  onEdit: (shipment: Shipment) => void;
  onDelete: (shipment: Shipment) => void;
}

const ShipmentRow = memo(({ shipment, onEdit, onDelete }: ShipmentRowProps) => {
  const handleEdit = useCallback(() => {
    onEdit(shipment);
  }, [onEdit, shipment]);

  const handleDelete = useCallback(() => {
    onDelete(shipment);
  }, [onDelete, shipment]);

  const formattedDate = useMemo(
    () => formatDate(shipment.lastSyncedAt),
    [shipment.lastSyncedAt]
  );

  return (
    <tr>
      <td className="table__cell--bold">{shipment.orderId}</td>
      <td>{shipment.customerName}</td>
      <td className="table__cell--truncate">{shipment.destination}</td>
      <td>
        <StatusBadge status={shipment.status} />
      </td>
      <td className="table__cell--muted">{formattedDate}</td>
      <td>
        <div className="table__actions">
          <button onClick={handleEdit} className="btn btn--sm btn--edit">
            Edit
          </button>
          <button onClick={handleDelete} className="btn btn--sm btn--delete">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

ShipmentRow.displayName = 'ShipmentRow';

export const ShipmentTable = memo(({ shipments, onEdit, onDelete }: ShipmentTableProps) => {
  if (shipments.length === 0) {
    return <div className="empty-state">No shipments found</div>;
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Destination</th>
            <th>Status</th>
            <th>Last Synced</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <ShipmentRow
              key={shipment.id}
              shipment={shipment}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

ShipmentTable.displayName = 'ShipmentTable';
