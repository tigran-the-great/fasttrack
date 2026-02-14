import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: {
    getShipments: vi.fn(),
    getShipment: vi.fn(),
    createShipment: vi.fn(),
    updateShipment: vi.fn(),
    deleteShipment: vi.fn(),
    triggerSync: vi.fn(),
  },
}));
