import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Delhivery webhook for tracking updates
router.post('/delhivery', async (req, res, next) => {
  try {
    const data = req.body;
    
    // Validate webhook signature if provided
    // const signature = req.headers['x-delhivery-signature'];
    
    if (!data.waybill) {
      return res.status(400).json({ error: 'Missing waybill' });
    }

    // Find order by AWB
    const order = await prisma.order.findUnique({
      where: { awbNumber: data.waybill },
    });

    if (!order) {
      console.log(`Order not found for AWB: ${data.waybill}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    let newStatus = order.status;
    const statusCode = data.Status?.Status || data.status;

    switch (statusCode) {
      case 'Manifested':
        newStatus = 'MANIFESTED';
        break;
      case 'Pickup':
      case 'PickedUp':
        newStatus = 'PICKED_UP';
        break;
      case 'In-transit':
      case 'InTransit':
        newStatus = 'IN_TRANSIT';
        break;
      case 'Out for Delivery':
      case 'OutForDelivery':
        newStatus = 'OUT_FOR_DELIVERY';
        break;
      case 'Delivered':
        newStatus = 'DELIVERED';
        break;
      case 'RTO':
        newStatus = 'RTO';
        break;
      case 'RTO-Delivered':
        newStatus = 'RTO_DELIVERED';
        break;
    }

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status: statusCode,
        statusCode: data.Status?.StatusCode,
        location: data.Status?.Instructions || data.location,
        remarks: data.Status?.StatusLocation || data.remarks,
        timestamp: data.Status?.StatusDateTime ? new Date(data.Status.StatusDateTime) : new Date(),
        rawData: data,
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        trackingStatus: statusCode,
        ...(newStatus === 'DELIVERED' && { actualDelivery: new Date() }),
      },
    });

    console.log(`Webhook processed for AWB ${data.waybill}: ${statusCode}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    next(error);
  }
});

export const webhooksRouter = router;
