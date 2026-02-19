import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { courierStatusToOrderStatus } from '../lib/orderStatus.js';
import { delhivery } from '../services/delhivery.js';
import { blitzService } from '../services/courier/BlitzService.js';
import { xpressbeesService } from '../services/courier/XpressbeesService.js';
import { ekartService } from '../services/courier/EkartService.js';
import { innofulfillService } from '../services/courier/InnofulfillService.js';

const router = Router();

/** Sync order status in DB from courier tracking (so "Out for Pickup", "Picked", "In Transit" etc. reflect on the website). */
async function syncOrderStatusFromTracking(awb: string, rawStatus: string): Promise<void> {
  if (!awb || !rawStatus) return;
  const status = courierStatusToOrderStatus(rawStatus);
  if (!status) return;
  const awbTrimmed = String(awb).trim();
  if (!awbTrimmed) return;
  try {
    const order = await prisma.order.findFirst({ where: { awbNumber: awbTrimmed } });
    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status,
          trackingStatus: rawStatus,
          ...(status === 'DELIVERED' ? { actualDelivery: new Date() } : {}),
        },
      });
      console.log(`Synced order ${order.orderNumber} status to ${status} (from tracking: ${rawStatus})`);
    } else {
      console.warn(`syncOrderStatusFromTracking: no order found for AWB ${awbTrimmed}, status was: ${rawStatus}`);
    }
  } catch (e) {
    console.error('syncOrderStatusFromTracking error:', e);
  }
}

// Public tracking endpoint (no auth required)
// Tries ALL courier APIs in parallel — returns whichever finds the AWB
// Returns RAW courier data + courier tag so frontend renders courier-specific UI
router.get('/track', async (req, res, next) => {
  try {
    const { awb, orderId, phone } = req.query;

    if (!awb && !orderId && !phone) {
      return res.status(400).json({ error: 'Provide AWB, order ID, or phone number' });
    }

    const trackingId = (awb || orderId || phone) as string;
    console.log(`Tracking shipment: ${trackingId}`);

    // Try all couriers in parallel
    const [delhiveryResult, blitzResult, xpressbeesResult, ekartResult, innofulfillResult] = await Promise.allSettled([
      // Delhivery
      (async () => {
        const params: any = {};
        if (awb) params.waybill = awb as string;
        if (orderId) params.orderIds = [(orderId as string)];
        if (phone) params.phone = phone as string;
        return { courier: 'delhivery', data: await delhivery.trackShipment(params) };
      })(),
      // Blitz
      (async () => {
        const result = await blitzService.trackShipment({
          awbNumber: awb as string | undefined,
          orderNumber: orderId as string | undefined,
        });
        if (!result.success) throw new Error(result.error || 'Not found');
        return { courier: 'blitz', data: result };
      })(),
      // Xpressbees
      (async () => {
        const result = await xpressbeesService.trackShipment({
          awbNumber: awb as string | undefined,
          orderNumber: orderId as string | undefined,
        });
        if (!result.success) throw new Error(result.error || 'Not found');
        return { courier: 'xpressbees', data: result };
      })(),
      // Ekart
      (async () => {
        const result = await ekartService.trackShipment({
          awbNumber: awb as string | undefined,
          orderNumber: orderId as string | undefined,
        });
        if (!result.success) throw new Error(result.error || 'Not found');
        return { courier: 'ekart', data: result };
      })(),
      // Innofulfill
      (async () => {
        const result = await innofulfillService.trackShipment({
          awbNumber: awb as string | undefined,
          orderNumber: orderId as string | undefined,
        });
        if (!result.success) throw new Error(result.error || 'Not found');
        return { courier: 'innofulfill', data: result };
      })(),
    ]);

    // Check Delhivery first (returns native ShipmentData format)
    if (delhiveryResult.status === 'fulfilled') {
      const dData = delhiveryResult.value.data;
      const shipment = dData?.ShipmentData?.[0]?.Shipment;
      if (shipment) {
        const awbNum = shipment.AWB;
        const currentStatus = shipment.Status?.Status;
        if (awbNum && currentStatus) await syncOrderStatusFromTracking(awbNum, currentStatus);
        console.log('Found on Delhivery');
        return res.json({ courier: 'delhivery', data: dData });
      }
    }

    // Check Blitz (use latest event if no currentStatus)
    if (blitzResult.status === 'fulfilled') {
      const data = blitzResult.value.data;
      const statusToSync = data?.currentStatus || data?.events?.[0]?.status;
      if (data?.awbNumber && statusToSync) await syncOrderStatusFromTracking(data.awbNumber, statusToSync);
      console.log('Found on Blitz');
      return res.json({ courier: 'blitz', data });
    }

    // Check Xpressbees (use latest event status if API doesn't send current_status)
    if (xpressbeesResult.status === 'fulfilled') {
      const data = xpressbeesResult.value.data;
      const statusToSync = data?.currentStatus || data?.events?.[0]?.status;
      if (data?.awbNumber && statusToSync) await syncOrderStatusFromTracking(data.awbNumber, statusToSync);
      console.log('Found on Xpressbees');
      return res.json({ courier: 'xpressbees', data });
    }

    // Check Ekart (use latest event if no currentStatus)
    if (ekartResult.status === 'fulfilled') {
      const data = ekartResult.value.data;
      const statusToSync = data?.currentStatus || data?.events?.[0]?.status;
      if (data?.awbNumber && statusToSync) await syncOrderStatusFromTracking(data.awbNumber, statusToSync);
      console.log('Found on Ekart');
      return res.json({ courier: 'ekart', data });
    }

    // Check Innofulfill (use latest event if no currentStatus)
    if (innofulfillResult.status === 'fulfilled') {
      const data = innofulfillResult.value.data;
      const statusToSync = data?.currentStatus || data?.events?.[0]?.status;
      if (data?.awbNumber && statusToSync) await syncOrderStatusFromTracking(data.awbNumber, statusToSync);
      console.log('Found on Innofulfill');
      return res.json({ courier: 'innofulfill', data });
    }

    // None found
    console.log('Shipment not found on any courier');
    return res.status(404).json({
      error: 'Shipment not found',
      message: `No tracking information found for ${trackingId} on any courier (Delhivery, Blitz, Xpressbees, Ekart, Innofulfill)`,
    });
  } catch (error) {
    next(error);
  }
});

// Authenticated tracking with order history
router.get('/orders/:orderNumber', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await delhivery.trackShipment({
      orderIds: [req.params.orderNumber],
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export const trackingRouter = router;
