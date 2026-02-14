import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusFilter } from './StatusFilter';

describe('StatusFilter', () => {
  it('should render all status options', () => {
    render(<StatusFilter value="" onChange={() => {}} />);

    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should have correct option values', () => {
    render(<StatusFilter value="" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options[0]).toHaveValue('');
    expect(options[1]).toHaveValue('PENDING');
    expect(options[2]).toHaveValue('IN_TRANSIT');
    expect(options[3]).toHaveValue('DELIVERED');
    expect(options[4]).toHaveValue('FAILED');
  });

  it('should display selected value', () => {
    render(<StatusFilter value="PENDING" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('PENDING');
  });

  it('should call onChange when value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StatusFilter value="" onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox'), 'IN_TRANSIT');

    expect(onChange).toHaveBeenCalledWith('IN_TRANSIT');
  });

  it('should call onChange with empty string for All Statuses', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StatusFilter value="PENDING" onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox'), '');

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should have form-select class', () => {
    render(<StatusFilter value="" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('form-select');
  });
});
