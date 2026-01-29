/**
 * COURIER SERVICES
 * 
 * Unified export for all courier-related services.
 * 
 * Usage:
 * ```typescript
 * import { getCourierService, CourierName } from './services/courier';
 * 
 * // Get service by name
 * const courier = getCourierService('BLITZ');
 * const result = await courier.createShipment(request);
 * 
 * // Or use directly
 * import { blitzService, delhiveryService } from './services/courier';
 * const result = await blitzService.createShipment(request);
 * ```
 */

// Re-export everything from factory (which re-exports from others)
export * from './CourierFactory.js';
export * from './types.js';
