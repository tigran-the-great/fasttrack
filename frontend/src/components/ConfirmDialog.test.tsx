import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: 'Confirm Action',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should render title and message', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should render default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Go Back"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('should disable buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should apply danger variant', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);

    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toHaveClass('btn--danger');
  });

  it('should apply primary variant by default', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toHaveClass('btn--primary');
  });

  it('should render ReactNode message', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        message={<span data-testid="custom-message">Custom JSX</span>}
      />
    );

    expect(screen.getByTestId('custom-message')).toBeInTheDocument();
  });
});
