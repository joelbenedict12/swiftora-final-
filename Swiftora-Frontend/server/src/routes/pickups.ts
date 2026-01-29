import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { delhivery } from '../services/delhivery.js';

const router = Router();

router.use(authenticate);

const CreatePickupSchema = z.object({
  warehouseId: z.string(),
  scheduledDate: z.string(), // ISO date
  scheduledTime: z.string().optional(),
  timeSlot: z.string().optional(),
  courierName: z.string().default('Delhivery'),
  orderCount: z.number().default(0),
  notes: z.string().optional(),
});

// List pickups
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Handle users without merchantId
    if (!req.user?.merchantId) {
      return res.json({ pickups: [] });
    }

    const where: any = {
      merchantId: req.user.merchantId,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate as string);
      if (endDate) where.scheduledDate.lte = new Date(endDate as string);
    }

    const pickups = await prisma.pickup.findMany({
      where,
      include: {
        warehouse: {
          select: {
            name: true,
            address: true,
            city: true,
            pincode: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    res.json(pickups);
  } catch (error) {
    next(error);
  }
});

// Get single pickup
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const pickup = await prisma.pickup.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId,
      },
      include: {
        warehouse: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!pickup) {
      throw new AppError(404, 'Pickup not found');
    }

    res.json(pickup);
  } catch (error) {
    next(error);
  }
});

// Create pickup
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = CreatePickupSchema.parse(req.body);

    if (!req.user!.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: data.warehouseId,
        merchantId: req.user!.merchantId,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    const pickupNumber = `PKP${Date.now()}`;

    const pickup = await prisma.pickup.create({
      data: {
        pickupNumber,
        merchantId: req.user!.merchantId,
        userId: req.user!.id,
        warehouseId: data.warehouseId,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        timeSlot: data.timeSlot,
        courierName: data.courierName,
        orderCount: data.orderCount,
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        warehouse: true,
      },
    });

    // Schedule pickup with Delhivery
    try {
      const pickupDate = new Date(data.scheduledDate);
      const dateStr = pickupDate.toISOString().split('T')[0];

      const delhiveryResponse = await delhivery.schedulePickup({
        pickup_location: warehouse.name,
        pickup_date: dateStr,
        pickup_time: data.scheduledTime || '10:00',
        expected_package_count: data.orderCount,
      });

      if (delhiveryResponse.success) {
        await prisma.pickup.update({
          where: { id: pickup.id },
          data: {
            manifestId: delhiveryResponse.manifest_id || null,
          },
        });
      }
    } catch (delhiveryError: any) {
      console.error('Delhivery pickup scheduling error:', delhiveryError.response?.data || delhiveryError.message);
      // Pickup created in DB but Delhivery failed - mark for manual scheduling
    }

    res.status(201).json(pickup);
  } catch (error) {
    next(error);
  }
});

// Cancel pickup
router.post('/:id/cancel', async (req: AuthRequest, res, next) => {
  try {
    const pickup = await prisma.pickup.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId,
      },
    });

    if (!pickup) {
      throw new AppError(404, 'Pickup not found');
    }

    if (pickup.status !== 'SCHEDULED') {
      throw new AppError(400, 'Cannot cancel pickup in current status');
    }

    const updated = await prisma.pickup.update({
      where: { id: pickup.id },
      data: { status: 'CANCELLED' },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export const pickupsRouter = router;
