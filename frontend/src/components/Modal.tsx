import { memo, ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  size?: 'default' | 'sm';
}

export const Modal = memo(({ children, size = 'default' }: ModalProps) => {
  const contentClass = size === 'sm' ? 'modal-content modal-content--sm' : 'modal-content';

  return (
    <div className="modal-overlay">
      <div className={contentClass}>
        {children}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';
