import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { delhivery } from '../services/delhivery.js';

const router = Router();

// Public tracking endpoint (no auth required)
router.get('/track', async (req, res, next) => {
  try {
    const { awb, orderId, phone } = req.query;

    if (!awb && !orderId && !phone) {
      return res.status(400).json({ error: 'Provide AWB, order ID, or phone number' });
    }

    const params: any = {};
    if (awb) params.waybill = awb as string;
    if (orderId) params.orderIds = [(orderId as string)];
    if (phone) params.phone = phone as string;

    const result = await delhivery.trackShipment(params);
    res.json(result);
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
