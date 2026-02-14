import { memo, useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../components/Toast';
import type { CreateShipmentDto, Shipment, ShipmentStatus } from '../../../types/shipment';

interface ShipmentFormProps {
  shipment?: Shipment;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ShipmentForm = memo(({ shipment, onSubmit, onCancel }: ShipmentFormProps) => {
  const [formData, setFormData] = useState<CreateShipmentDto>(() => ({
    orderId: shipment?.orderId || '',
    customerName: shipment?.customerName || '',
    destination: shipment?.destination || '',
    status: shipment?.status || 'PENDING',
  }));
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (shipment) {
        await api.updateShipment(shipment.id, {
          customerName: formData.customerName,
          destination: formData.destination,
          status: formData.status,
        });
        showToast('Shipment updated successfully', 'success');
      } else {
        await api.createShipment(formData);
        showToast('Shipment created successfully', 'success');
      }
      onSubmit();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save shipment', 'error');
    } finally {
      setLoading(false);
    }
  }, [shipment, formData, showToast, onSubmit]);

  const handleOrderIdChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, orderId: e.target.value }));
  }, []);

  const handleCustomerNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, customerName: e.target.value }));
  }, []);

  const handleDestinationChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, destination: e.target.value }));
  }, []);

  const handleStatusChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.value as ShipmentStatus }));
  }, []);

  const submitBtnClass = useMemo(
    () => `btn btn--primary ${loading ? 'btn--loading' : ''}`,
    [loading]
  );

  const submitLabel = useMemo(() => {
    if (loading) return 'Saving...';
    return shipment ? 'Update' : 'Create';
  }, [loading, shipment]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Order ID</label>
        <input
          type="text"
          value={formData.orderId}
          onChange={handleOrderIdChange}
          className="form-input"
          required
          disabled={!!shipment}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Customer Name</label>
        <input
          type="text"
          value={formData.customerName}
          onChange={handleCustomerNameChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Destination</label>
        <input
          type="text"
          value={formData.destination}
          onChange={handleDestinationChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select
          value={formData.status}
          onChange={handleStatusChange}
          className="form-select"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn--secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className={submitBtnClass}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
});

ShipmentForm.displayName = 'ShipmentForm';
