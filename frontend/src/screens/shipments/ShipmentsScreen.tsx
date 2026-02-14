import { useState, useCallback } from 'react';
import { useShipments } from '../../hooks/useShipments';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { SyncButton } from '../../components/SyncButton';
import { ShipmentForm, ShipmentTable, StatusFilter } from './components';
import type { Shipment, ShipmentStatus } from '../../types/shipment';

export const ShipmentsScreen = () => {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | undefined>();
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showToast } = useToast();

  const { shipments, meta, loading, error, refetch } = useShipments({
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const handleStatusFilterChange = useCallback((status: ShipmentStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const handleEdit = useCallback((shipment: Shipment) => {
    setEditingShipment(shipment);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingShipment(undefined);
  }, []);

  const handleFormSubmit = useCallback(() => {
    setShowForm(false);
    setEditingShipment(undefined);
    refetch();
  }, [refetch]);

  const handleDeleteClick = useCallback((shipment: Shipment) => {
    setDeletingShipment(shipment);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingShipment) return;
    setDeleteLoading(true);
    try {
      await api.deleteShipment(deletingShipment.id);
      setDeletingShipment(null);
      showToast('Shipment deleted successfully', 'success');
      refetch();
    } catch {
      showToast('Failed to delete shipment', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingShipment, showToast, refetch]);

  const handleDeleteCancel = useCallback(() => {
    setDeletingShipment(null);
  }, []);

  const handleNewShipment = useCallback(() => {
    setShowForm(true);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="shipment-list">
      <div className="shipment-list__header">
        <h1 className="shipment-list__title">Shipments</h1>
        <div className="shipment-list__actions">
          <SyncButton onSyncComplete={refetch} />
          <button onClick={handleNewShipment} className="btn btn--success">
            + New Shipment
          </button>
        </div>
      </div>

      {showForm && (
        <Modal>
          <h2 className="modal-title">
            {editingShipment ? 'Edit Shipment' : 'New Shipment'}
          </h2>
          <ShipmentForm
            shipment={editingShipment}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
          />
        </Modal>
      )}

      {deletingShipment && (
        <ConfirmDialog
          title="Delete Shipment"
          message={
            <p style={{ margin: 0 }}>
              Are you sure you want to delete shipment <strong>{deletingShipment.orderId}</strong>? This action cannot be undone.
            </p>
          }
          confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
          loading={deleteLoading}
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      <div className="shipment-list__filters">
        <StatusFilter value={statusFilter} onChange={handleStatusFilterChange} />
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : error ? (
        <div className="empty-state text-error">{error}</div>
      ) : (
        <>
          <ShipmentTable
            shipments={shipments}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
          {meta && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};
