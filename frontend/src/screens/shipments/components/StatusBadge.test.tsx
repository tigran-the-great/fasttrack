import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('should render PENDING status', () => {
    render(<StatusBadge status="PENDING" />);

    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge--pending');
  });

  it('should render IN_TRANSIT status', () => {
    render(<StatusBadge status="IN_TRANSIT" />);

    const badge = screen.getByText('In Transit');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge--in-transit');
  });

  it('should render DELIVERED status', () => {
    render(<StatusBadge status="DELIVERED" />);

    const badge = screen.getByText('Delivered');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge--delivered');
  });

  it('should render FAILED status', () => {
    render(<StatusBadge status="FAILED" />);

    const badge = screen.getByText('Failed');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge--failed');
  });

  it('should have base status-badge class', () => {
    render(<StatusBadge status="PENDING" />);

    const badge = screen.getByText('Pending');
    expect(badge).toHaveClass('status-badge');
  });
});
