import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { delhivery } from '../services/delhivery.js';
import { blitzService } from '../services/courier/BlitzService.js';
import { xpressbeesService } from '../services/courier/XpressbeesService.js';

const router = Router();

/**
 * Normalize Blitz/Xpressbees tracking response to Delhivery ShipmentData format
 * so the frontend can display it without any changes
 */
function normalizeToShipmentData(courierResult: any, courier: string) {
  if (!courierResult?.success) return null;

  const events = courierResult.events || [];
  const raw = courierResult.rawResponse;

  // Build Scans array matching Delhivery format
  const scans = events.map((event: any) => ({
    ScanDetail: {
      Scan: event.status || 'Update',
      ScanDateTime: event.timestamp ? new Date(event.timestamp).toISOString() : '',
      ScannedLocation: event.location || '',
      Instructions: event.remarks || '',
    },
  }));

  let origin = '';
  let destination = '';
  let expectedDeliveryDate = '';
  let referenceNo = '';
  let codAmount = 0;

  if (courier === 'blitz' && raw?.result?.[0]) {
    const r = raw.result[0];
    origin = r.shippingPartner || '';
    expectedDeliveryDate = r.estimatedDeliveryDate || '';
    referenceNo = r.shopOrderNumber || '';
    codAmount = parseFloat(r.codAmount) || 0;
  } else if (courier === 'xpressbees' && raw?.data) {
    const d = raw.data;
    origin = d.origin || d.pickup_city || '';
    destination = d.destination || d.delivery_city || '';
    expectedDeliveryDate = d.expected_delivery_date || '';
  }

  return {
    ShipmentData: [
      {
        Shipment: {
          Status: {
            Status: courierResult.currentStatus || 'Unknown',
            StatusLocation: events[0]?.location || '',
            StatusDateTime: events[0]?.timestamp ? new Date(events[0].timestamp).toISOString() : '',
            StatusType: '',
            Instructions: events[0]?.remarks || '',
          },
          Origin: origin,
          Destination: destination,
          ExpectedDeliveryDate: expectedDeliveryDate,
          Scans: scans,
          PickUpDate: '',
          OrderType: '',
          CODAmount: codAmount,
          ReferenceNo: referenceNo,
          _courier: courier,
        },
      },
    ],
  };
}

// Public tracking endpoint (no auth required)
// Tries ALL courier APIs in parallel — returns whichever finds the AWB
router.get('/track', async (req, res, next) => {
  try {
    const { awb, orderId, phone } = req.query;

    if (!awb && !orderId && !phone) {
      return res.status(400).json({ error: 'Provide AWB, order ID, or phone number' });
    }

    const trackingId = (awb || orderId || phone) as string;
    console.log(`Tracking shipment: ${trackingId}`);

    // Try all couriers in parallel
    const [delhiveryResult, blitzResult, xpressbeesResult] = await Promise.allSettled([
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
    ]);

    // Check Delhivery first (it returns in native format)
    if (delhiveryResult.status === 'fulfilled') {
      const dData = delhiveryResult.value.data;
      // Delhivery returns raw ShipmentData — check if it has valid data
      if (dData?.ShipmentData?.[0]?.Shipment) {
        console.log('Found on Delhivery');
        return res.json(dData);
      }
    }

    // Check Blitz
    if (blitzResult.status === 'fulfilled') {
      const normalized = normalizeToShipmentData(blitzResult.value.data, 'blitz');
      if (normalized) {
        console.log('Found on Blitz');
        return res.json(normalized);
      }
    }

    // Check Xpressbees
    if (xpressbeesResult.status === 'fulfilled') {
      const normalized = normalizeToShipmentData(xpressbeesResult.value.data, 'xpressbees');
      if (normalized) {
        console.log('Found on Xpressbees');
        return res.json(normalized);
      }
    }

    // None found
    console.log('Shipment not found on any courier');
    return res.status(404).json({
      error: 'Shipment not found',
      message: `No tracking information found for ${trackingId} on any courier (Delhivery, Blitz, Xpressbees)`,
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
