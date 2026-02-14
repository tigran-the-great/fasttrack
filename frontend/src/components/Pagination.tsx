import { memo, useCallback } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = memo(({ page, totalPages, onPageChange }: PaginationProps) => {
  const handlePrevious = useCallback(() => {
    onPageChange(Math.max(1, page - 1));
  }, [onPageChange, page]);

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages, page + 1));
  }, [onPageChange, page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        onClick={handlePrevious}
        disabled={page === 1}
        className="pagination__btn"
      >
        Previous
      </button>
      <span className="pagination__info">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={page === totalPages}
        className="pagination__btn"
      >
        Next
      </button>
    </div>
  );
});

Pagination.displayName = 'Pagination';
