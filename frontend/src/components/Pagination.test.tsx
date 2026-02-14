import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('should not render when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when totalPages is 0', () => {
    const { container } = render(
      <Pagination page={1} totalPages={0} onPageChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render pagination controls when totalPages > 1', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);

    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />);

    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('should call onPageChange with previous page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByText('Previous'));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange with next page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByText('Next'));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('should not go below page 1', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('should not go above totalPages', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={5} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText('Next')).toBeDisabled();
  });
});
