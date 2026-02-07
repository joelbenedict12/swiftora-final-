/**
 * COURIER FACTORY
 * 
 * Factory pattern for creating courier service instances.
 * Following Open/Closed Principle (OCP) - open for extension, closed for modification.
 * 
 * To add a new courier:
 * 1. Create a new service class implementing ICourierService
 * 2. Register it in the courierMap below
 */

import { ICourierService, CourierName } from './types.js';
import { DelhiveryService, delhiveryService } from './DelhiveryService.js';
import { BlitzService, blitzService } from './BlitzService.js';
import { EkartService, ekartService } from './EkartService.js';
import { XpressbeesService, xpressbeesService } from './XpressbeesService.js';
import { InnofulfillService, innofulfillService } from './InnofulfillService.js';

// Map of courier names to service instances
const courierMap: Record<CourierName, ICourierService> = {
  DELHIVERY: delhiveryService,
  BLITZ: blitzService,
  EKART: ekartService,
  XPRESSBEES: xpressbeesService,
  INNOFULFILL: innofulfillService,
};

/**
 * Get courier service by name
 */
export function getCourierService(courierName: CourierName): ICourierService {
  const service = courierMap[courierName];

  if (!service) {
    throw new Error(`Unknown courier: ${courierName}. Available couriers: ${Object.keys(courierMap).join(', ')}`);
  }

  return service;
}

/**
 * Get all available courier names
 */
export function getAvailableCouriers(): CourierName[] {
  return Object.keys(courierMap) as CourierName[];
}

/**
 * Check if a courier is supported
 */
export function isCourierSupported(name: string): name is CourierName {
  return name in courierMap;
}

/**
 * Create a new instance of a courier service (if you need fresh instances)
 */
export function createCourierService(courierName: CourierName): ICourierService {
  switch (courierName) {
    case 'DELHIVERY':
      return new DelhiveryService();
    case 'BLITZ':
      return new BlitzService();
    case 'EKART':
      return new EkartService();
    case 'XPRESSBEES':
      return new XpressbeesService();
    case 'INNOFULFILL':
      return new InnofulfillService();
    default:
      throw new Error(`Unknown courier: ${courierName}`);
  }
}

// Export everything for convenience
export {
  ICourierService,
  CourierName,
  DelhiveryService,
  BlitzService,
  EkartService,
  XpressbeesService,
  InnofulfillService,
  delhiveryService,
  blitzService,
  ekartService,
  xpressbeesService,
  innofulfillService,
};

// Re-export types
export * from './types.js';
