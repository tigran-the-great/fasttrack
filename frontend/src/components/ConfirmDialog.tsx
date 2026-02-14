import { memo, ReactNode, useMemo } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const confirmBtnClass = useMemo(() => {
    const variantClass = variant === 'danger' ? 'btn--danger' : 'btn--primary';
    const loadingClass = loading ? 'btn--loading' : '';
    return `btn ${variantClass} ${loadingClass}`.trim();
  }, [variant, loading]);

  return (
    <Modal size="sm">
      <h2 className="modal-title modal-title--compact">{title}</h2>
      <div className="confirm-dialog__message">{message}</div>
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn btn--secondary"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={confirmBtnClass}
        >
          {loading ? 'Loading...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
