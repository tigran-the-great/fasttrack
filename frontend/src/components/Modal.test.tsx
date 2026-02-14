import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should render children', () => {
    render(
      <Modal>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should render with overlay', () => {
    render(
      <Modal>
        <div>Content</div>
      </Modal>
    );

    expect(document.querySelector('.modal-overlay')).toBeInTheDocument();
  });

  it('should render with default size', () => {
    render(
      <Modal>
        <div>Content</div>
      </Modal>
    );

    const content = document.querySelector('.modal-content');
    expect(content).toBeInTheDocument();
    expect(content).not.toHaveClass('modal-content--sm');
  });

  it('should render with small size', () => {
    render(
      <Modal size="sm">
        <div>Content</div>
      </Modal>
    );

    const content = document.querySelector('.modal-content--sm');
    expect(content).toBeInTheDocument();
  });
});
