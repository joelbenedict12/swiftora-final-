/**
 * UNIVERSAL NDR SERVICE
 * 
 * Routes NDR actions to the correct courier-specific handler.
 * To add new courier: import handler, add case in switch.
 */
import { delhiveryNdr } from './ndr/DelhiveryNdr.js';
import { ekartNdr } from './ndr/EkartNdr.js';
import { blitzNdr } from './ndr/BlitzNdr.js';
import { xpressbeesNdr } from './ndr/XpressbeesNdr.js';
import { innofulfillNdr } from './ndr/InnofulfillNdr.js';
import { prisma } from '../lib/prisma.js';

export interface NdrActionRequest {
    courier: string;
    awbNumber: string;
    action: string;   // reattempt | rto | update_address | update_phone | reschedule
    payload?: Record<string, any>;
}

export interface NdrActionResponse {
    success: boolean;
    message: string;
    raw?: any;
}

// Supported actions per courier
export const SUPPORTED_ACTIONS: Record<string, string[]> = {
    DELHIVERY: ['reattempt', 'reschedule'],
    EKART: ['reattempt', 'rto'],
    BLITZ: ['reattempt', 'rto'],
    XPRESSBEES: ['reattempt', 'update_address', 'update_phone'],
    INNOFULFILL: [],
};

/**
 * Universal NDR action dispatcher
 */
export async function handleNdrAction(req: NdrActionRequest): Promise<NdrActionResponse> {
    const courier = req.courier.toUpperCase();

    switch (courier) {
        case 'DELHIVERY':
            return delhiveryNdr({ awbNumber: req.awbNumber, action: req.action });
        case 'EKART':
            return ekartNdr({ awbNumber: req.awbNumber, action: req.action, payload: req.payload });
        case 'BLITZ':
            return blitzNdr({ awbNumber: req.awbNumber, action: req.action, payload: req.payload });
        case 'XPRESSBEES':
            return xpressbeesNdr({ awbNumber: req.awbNumber, action: req.action, payload: req.payload });
        case 'INNOFULFILL':
            return innofulfillNdr({ awbNumber: req.awbNumber, action: req.action, payload: req.payload });
        default:
            return { success: false, message: `Unsupported courier for NDR: ${courier}` };
    }
}

/**
 * Auto-create NdrCase when order status becomes NDR_PENDING.
 * Prevents duplicates. Called from dashboard sync, tracking sync, and webhooks.
 */
export async function createNdrCaseIfNeeded(orderId: string, rawStatus?: string): Promise<void> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, awbNumber: true, courierName: true, status: true },
        });
        if (!order || order.status !== 'NDR_PENDING') return;
        if (!order.awbNumber) return;

        // Check if NDR case already exists
        const existing = await prisma.ndrCase.findUnique({ where: { orderId } });
        if (existing) return;

        await prisma.ndrCase.create({
            data: {
                orderId,
                awbNumber: order.awbNumber,
                courierName: order.courierName || 'UNKNOWN',
                ndrReason: rawStatus || 'Delivery failed',
            },
        });
        console.log(`[NDR] Created NDR case for order ${orderId}, AWB ${order.awbNumber}`);
    } catch (e) {
        console.error('[NDR] createNdrCaseIfNeeded error:', e);
    }
}
