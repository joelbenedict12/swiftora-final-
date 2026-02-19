/**
 * Maps raw courier tracking status strings (from any of the 5 couriers) to our OrderStatus enum.
 * Used when syncing order status from tracking API or webhooks.
 */
export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'MANIFESTED'
  | 'OUT_FOR_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RTO'
  | 'RTO_DELIVERED'
  | 'FAILED';

const OUT_FOR_PICKUP_ALIASES = [
  'out for pickup',
  'out for pick up',
  'out for pick-up',
  'outforpickup',
  'ready for pickup',
  'scheduled for pickup',
  'pickup scheduled',
  'out for collection',
  'pickup pending',
];

const PICKED_UP_ALIASES = [
  'picked up',
  'pickedup',
  'pickup',
  'picked',
  'collected',
  'pickup done',
];

const IN_TRANSIT_ALIASES = [
  'in transit',
  'intransit',
  'in-transit',
  'dispatched',
  'shipped',
  'moving',
];

const OUT_FOR_DELIVERY_ALIASES = [
  'out for delivery',
  'out for delivery',
  'ofd',
];

const DELIVERED_ALIASES = [
  'delivered',
  'delivery completed',
  'completed',
];

const RTO_ALIASES = [
  'rto',
  'return to origin',
  'returned',
  'return in transit',
];

const RTO_DELIVERED_ALIASES = [
  'rto delivered',
  'rto-delivered',
  'return delivered',
];

const MANIFESTED_ALIASES = [
  'manifested',
  'manifest',
  'created',
  'registered',
];

function normalize(s: string): string {
  return (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesAny(normalized: string, aliases: string[]): boolean {
  return aliases.some((a) => normalized === a || normalized.includes(a));
}

/**
 * Returns our OrderStatus for a given courier status string, or null if no mapping.
 */
export function courierStatusToOrderStatus(raw: string | null | undefined): OrderStatus | null {
  if (raw == null || raw === '') return null;
  const n = normalize(raw);

  if (matchesAny(n, DELIVERED_ALIASES)) return 'DELIVERED';
  if (matchesAny(n, RTO_DELIVERED_ALIASES)) return 'RTO_DELIVERED';
  if (matchesAny(n, RTO_ALIASES)) return 'RTO';
  if (matchesAny(n, OUT_FOR_DELIVERY_ALIASES)) return 'OUT_FOR_DELIVERY';
  if (matchesAny(n, IN_TRANSIT_ALIASES)) return 'IN_TRANSIT';
  if (matchesAny(n, OUT_FOR_PICKUP_ALIASES)) return 'OUT_FOR_PICKUP';
  if (matchesAny(n, PICKED_UP_ALIASES)) return 'PICKED_UP';
  if (matchesAny(n, MANIFESTED_ALIASES)) return 'MANIFESTED';

  // Explicit known strings (case-insensitive)
  if (n === 'ready to ship' || n === 'ready_to_ship') return 'READY_TO_SHIP';
  if (n === 'cancelled' || n === 'canceled') return 'CANCELLED';
  if (n === 'failed') return 'FAILED';

  return null;
}
