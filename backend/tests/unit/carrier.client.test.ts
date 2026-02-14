import { describe, it, expect } from '@jest/globals';
import { CarrierClient } from '../../src/external/carrier.client.js';

describe('CarrierClient', () => {
  describe('mapCarrierStatusToInternal', () => {
    let client: CarrierClient;

    beforeEach(() => {
      client = new CarrierClient();
    });

    it('should map pending to PENDING', () => {
      expect(client.mapCarrierStatusToInternal('pending')).toBe('PENDING');
    });

    it('should map in_transit to IN_TRANSIT', () => {
      expect(client.mapCarrierStatusToInternal('in_transit')).toBe('IN_TRANSIT');
    });

    it('should map in_progress to IN_TRANSIT', () => {
      expect(client.mapCarrierStatusToInternal('in_progress')).toBe('IN_TRANSIT');
    });

    it('should map shipped to IN_TRANSIT', () => {
      expect(client.mapCarrierStatusToInternal('shipped')).toBe('IN_TRANSIT');
    });

    it('should map delivered to DELIVERED', () => {
      expect(client.mapCarrierStatusToInternal('delivered')).toBe('DELIVERED');
    });

    it('should map completed to DELIVERED', () => {
      expect(client.mapCarrierStatusToInternal('completed')).toBe('DELIVERED');
    });

    it('should map failed to FAILED', () => {
      expect(client.mapCarrierStatusToInternal('failed')).toBe('FAILED');
    });

    it('should map cancelled to FAILED', () => {
      expect(client.mapCarrierStatusToInternal('cancelled')).toBe('FAILED');
    });

    it('should map error to FAILED', () => {
      expect(client.mapCarrierStatusToInternal('error')).toBe('FAILED');
    });

    it('should handle case insensitivity', () => {
      expect(client.mapCarrierStatusToInternal('PENDING')).toBe('PENDING');
      expect(client.mapCarrierStatusToInternal('IN_TRANSIT')).toBe('IN_TRANSIT');
      expect(client.mapCarrierStatusToInternal('Delivered')).toBe('DELIVERED');
    });

    it('should handle hyphenated and spaced statuses', () => {
      expect(client.mapCarrierStatusToInternal('in-transit')).toBe('IN_TRANSIT');
      expect(client.mapCarrierStatusToInternal('in transit')).toBe('IN_TRANSIT');
    });

    it('should default to PENDING for unknown status', () => {
      expect(client.mapCarrierStatusToInternal('unknown')).toBe('PENDING');
      expect(client.mapCarrierStatusToInternal('random')).toBe('PENDING');
    });

    it('should return PENDING for undefined or null status', () => {
      expect(client.mapCarrierStatusToInternal(undefined as any)).toBe('PENDING');
      expect(client.mapCarrierStatusToInternal(null as any)).toBe('PENDING');
      expect(client.mapCarrierStatusToInternal('')).toBe('PENDING');
    });
  });

  describe('mapInternalStatusToCarrier', () => {
    let client: CarrierClient;

    beforeEach(() => {
      client = new CarrierClient();
    });

    it('should map PENDING to pending', () => {
      expect(client.mapInternalStatusToCarrier('PENDING')).toBe('pending');
    });

    it('should map IN_TRANSIT to in_transit', () => {
      expect(client.mapInternalStatusToCarrier('IN_TRANSIT')).toBe('in_transit');
    });

    it('should map DELIVERED to delivered', () => {
      expect(client.mapInternalStatusToCarrier('DELIVERED')).toBe('delivered');
    });

    it('should map FAILED to failed', () => {
      expect(client.mapInternalStatusToCarrier('FAILED')).toBe('failed');
    });
  });
});
