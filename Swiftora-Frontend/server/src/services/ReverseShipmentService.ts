/**
 * REVERSE SHIPMENT SERVICE
 * 
 * Handles creating reverse (return) shipments across all couriers.
 * Each reverse shipment is a new Order record with shipmentType=REVERSE,
 * linked to the original forward order via parentOrderId.
 */
import { prisma } from '../lib/prisma.js';
import { delhivery } from './delhivery.js';
import { blitzService } from './courier/BlitzService.js';
import { xpressbeesService } from './courier/XpressbeesService.js';
import { ekartService } from './courier/EkartService.js';
import { innofulfillService } from './courier/InnofulfillService.js';
import { createDelhiveryReverse } from './reverse/DelhiveryReverse.js';
import { createXpressbeesReverse } from './reverse/XpressbeesReverse.js';
import { createBlitzReverse } from './reverse/BlitzReverse.js';
import { createInnofulfillReverse } from './reverse/InnofulfillReverse.js';

export interface ReverseRequest {
    forwardOrderId: string;
    reason: string;
    pickupDate?: string;
    phone?: string;        // updated phone for reverse pickup
    address?: string;      // updated address for reverse pickup
}

export interface ReverseResponse {
    success: boolean;
    reverseOrderId?: string;
    awbNumber?: string;
    message: string;
    raw?: any;
}

/**
 * Create a reverse (return) shipment for a forward order.
 */
export async function createReverseShipment(
    req: ReverseRequest,
    userId?: string,
): Promise<ReverseResponse> {
    // 1) Fetch forward order with warehouse
    const forward = await prisma.order.findUnique({
        where: { id: req.forwardOrderId },
        include: { warehouse: true },
    });

    if (!forward) {
        return { success: false, message: 'Forward order not found' };
    }

    // 2) Validate: must be DELIVERED, NDR_PENDING, or RTO
    const allowedStatuses = ['DELIVERED', 'NDR_PENDING', 'RTO'];
    if (!allowedStatuses.includes(forward.status)) {
        return { success: false, message: `Cannot initiate reverse for order in ${forward.status} status. Allowed: ${allowedStatuses.join(', ')}` };
    }

    // 3) Validate: cannot reverse a reverse shipment
    if (forward.shipmentType === 'REVERSE') {
        return { success: false, message: 'Cannot create reverse of a reverse shipment' };
    }

    // 4) Validate: no active reverse already exists
    const existingReverse = await prisma.order.findFirst({
        where: {
            parentOrderId: forward.id,
            shipmentType: 'REVERSE',
            status: { notIn: ['CANCELLED', 'FAILED', 'DELIVERED'] },
        },
    });
    if (existingReverse) {
        return { success: false, message: `Active reverse shipment already exists: ${existingReverse.orderNumber} (AWB: ${existingReverse.awbNumber || 'pending'})` };
    }

    // 5) Generate unique reverse order number
    const reverseOrderNumber = `RVP-${forward.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

    // 6) Create the reverse order record (initially PENDING)
    const reverseOrder = await prisma.order.create({
        data: {
            orderNumber: reverseOrderNumber,
            merchantId: forward.merchantId,
            userId: userId || forward.userId || undefined,
            warehouseId: forward.warehouseId,
            shipmentType: 'REVERSE',
            parentOrderId: forward.id,
            reverseReason: req.reason,
            // For reverse: customer address = pickup, warehouse = delivery
            customerName: forward.customerName,
            customerPhone: req.phone || forward.customerPhone,
            customerEmail: forward.customerEmail,
            shippingAddress: forward.warehouse?.address || forward.shippingAddress,
            shippingCity: forward.warehouse?.city || forward.shippingCity,
            shippingState: forward.warehouse?.state || forward.shippingState,
            shippingPincode: forward.warehouse?.pincode || forward.shippingPincode,
            productName: forward.productName,
            productValue: forward.productValue,
            quantity: forward.quantity,
            paymentMode: 'PREPAID', // Reverse is always prepaid (no COD collection)
            weight: forward.weight,
            length: forward.length,
            breadth: forward.breadth,
            height: forward.height,
            status: 'PENDING',
        },
    });

    // 7) Call courier-specific reverse API
    const courier = (forward.courierName || '').toUpperCase();
    let result: ReverseResponse;

    try {
        switch (courier) {
            case 'DELHIVERY':
                result = await createDelhiveryReverse(forward, reverseOrder, req);
                break;
            case 'XPRESSBEES':
                result = await createXpressbeesReverse(forward, reverseOrder, req);
                break;
            case 'BLITZ':
                result = await createBlitzReverse(forward, reverseOrder, req);
                break;
            case 'INNOFULFILL':
                result = await createInnofulfillReverse(forward, reverseOrder, req);
                break;
            case 'EKART':
                // Ekart uses Blitz API with returnShipmentFlag
                result = await createBlitzReverse(forward, reverseOrder, req);
                break;
            default:
                result = { success: false, message: `Reverse pickup not supported for courier: ${courier}` };
        }
    } catch (err: any) {
        console.error(`[Reverse] Courier API error for ${courier}:`, err.message);
        result = { success: false, message: err.message || 'Courier API call failed' };
    }

    // 8) Update reverse order with AWB or mark as FAILED
    if (result.success && result.awbNumber) {
        await prisma.order.update({
            where: { id: reverseOrder.id },
            data: {
                awbNumber: result.awbNumber,
                courierName: courier,
                status: 'PROCESSING',
                trackingStatus: 'Reverse pickup booked',
            },
        });
        return {
            success: true,
            reverseOrderId: reverseOrder.id,
            awbNumber: result.awbNumber,
            message: `Reverse pickup booked! AWB: ${result.awbNumber}`,
            raw: result.raw,
        };
    } else {
        await prisma.order.update({
            where: { id: reverseOrder.id },
            data: { status: 'FAILED', trackingStatus: result.message },
        });
        return {
            success: false,
            reverseOrderId: reverseOrder.id,
            message: result.message,
            raw: result.raw,
        };
    }
}
