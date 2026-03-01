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
  | 'FAILED'
  | 'NDR_PENDING';

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
  'pickup assigned',
  'pickup generated',
  'pickup requested',
  'pp', // Xpressbees status code
];

const PICKED_UP_ALIASES = [
  'picked up',
  'pickedup',
  'pickup',
  'picked',
  'collected',
  'pickup done',
  'pickup complete',
  'pickup completed',
  'shipment picked up',
  'pk', // Xpressbees status code
];

const IN_TRANSIT_ALIASES = [
  'in transit',
  'intransit',
  'in-transit',
  'dispatched',
  'shipped',
  'moving',
  'in_transit',
  'forwarded',
  'received at hub',
  'reached at destination hub',
  'arrived at hub',
  'in hub',
  'hub scan',
  'bag scan',
  'added to bag',
  'received at origin hub',
  'connection allocated',
  'further connected',
  'sl', // Xpressbees status code for "Soft Loaded"
  'it', // Xpressbees status code
  'ot', // Xpressbees status code for "On the way"
  'rac', // Ekart: Reached at center
];

const OUT_FOR_DELIVERY_ALIASES = [
  'out for delivery',
  'ofd',
  'out_for_delivery',
  'dispatched to customer',
  'last mile',
  'dl', // Xpressbees status code for "Out for Delivery"
];

const DELIVERED_ALIASES = [
  'delivered',
  'delivery completed',
  'completed',
  'shipment delivered',
  'del', // Xpressbees status code
  'ok', // Ekart delivered status
];

const RTO_ALIASES = [
  'rto',
  'return to origin',
  'returned',
  'return in transit',
  'rto in transit',
  'rto_in_transit',
  'rto initiated',
  'returning',
  'rt', // Xpressbees status code
];

const RTO_DELIVERED_ALIASES = [
  'rto delivered',
  'rto-delivered',
  'return delivered',
  'rto_delivered',
  'returned to shipper',
  'returned to origin',
  'rd', // Xpressbees status code
];

const CANCELLED_ALIASES = [
  'cancelled',
  'canceled',
  'shipment cancelled',
  'cancel',
];

const MANIFESTED_ALIASES = [
  'manifested',
  'manifest',
  'created',
  'registered',
  'data received',
  'booked',
  'order placed',
  'pending pickup',
  'not picked',
  'np', // Xpressbees status code
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

  if (matchesAny(n, CANCELLED_ALIASES)) return 'CANCELLED';

  // NDR aliases — must be checked BEFORE generic FAILED
  const NDR_ALIASES = [
    'failed delivery', 'ndr', 'customer unavailable', 'address issue',
    'delivery attempt failed', 'customer refused', 'wrong address',
    'customer not available', 'incomplete address', 'door locked',
    'customer wants open delivery', 'entry restricted',
    'phn', // Xpressbees: phone not reachable
    'cna', // Xpressbees: customer not available
    'ofd-ndr', 'ndr raised', 'ndr initiated', 'ndr pending',
    'consignee refused', 'refused delivery', 'refused by customer',
  ];
  if (matchesAny(n, NDR_ALIASES)) return 'NDR_PENDING';

  if (n === 'ready to ship' || n === 'ready_to_ship') return 'READY_TO_SHIP';
  if (n === 'failed' || n === 'delivery failed' || n === 'undelivered') return 'NDR_PENDING';

  return null;
}
