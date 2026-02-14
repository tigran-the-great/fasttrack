import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>Show Success</button>
      <button onClick={() => showToast('Error message', 'error')}>Show Error</button>
      <button onClick={() => showToast('Info message')}>Show Info</button>
    </div>
  );
};

describe('Toast', () => {
  describe('ToastProvider', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div>Test Content</div>
        </ToastProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render toast container', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      expect(document.querySelector('.toast-container')).toBeInTheDocument();
    });
  });

  describe('useToast', () => {
    it('should throw error when used outside ToastProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const ThrowingComponent = () => {
        useToast();
        return null;
      };

      expect(() => {
        render(<ThrowingComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleError.mockRestore();
    });

    it('should show success toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(document.querySelector('.toast--success')).toBeInTheDocument();
    });

    it('should show error toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(document.querySelector('.toast--error')).toBeInTheDocument();
    });

    it('should show info toast by default', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(document.querySelector('.toast--info')).toBeInTheDocument();
    });

    it('should auto-dismiss toast after 4 seconds', () => {
      vi.useFakeTimers();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should dismiss toast when close button is clicked', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();

      fireEvent.click(screen.getByText('×'));

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    it('should show multiple toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should display correct icons for each toast type', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));
      expect(screen.getByText('✓')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Show Error'));
      expect(screen.getByText('✕')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Show Info'));
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });
  });
});
