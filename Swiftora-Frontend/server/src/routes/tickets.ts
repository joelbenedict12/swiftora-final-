import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const router = Router();
router.use(authenticate);

const CreateTicketSchema = z.object({
  type: z.enum(['DELIVERY_ISSUE', 'WEIGHT_DISPUTE', 'LOST_DAMAGED', 'COURIER_ESCALATION', 'BILLING_ISSUE', 'PICKUP_ISSUE', 'OTHER']),
  subject: z.string().min(1),
  description: z.string().min(1),
  orderId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

const UpdateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  resolution: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

// Create ticket (customer)
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const data = CreateTicketSchema.parse(req.body);

    // Generate ticket number (globally unique)
    const count = await prisma.ticket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Verify order belongs to merchant if orderId provided
    // orderId can be either the actual ID (cuid) or the orderNumber (e.g., ORD123456)
    let order = null;
    if (data.orderId) {
      // Try to find by orderNumber or id
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: data.orderId, merchantId: req.user.merchantId },
            { id: data.orderId, merchantId: req.user.merchantId },
          ],
        },
      });

      if (!order) {
        throw new AppError(404, 'Order not found. Please enter a valid order ID or order number.');
      }
    }

    // Calculate SLA due date (default 48 hours)
    const slaHours = data.priority === 'URGENT' ? 24 : data.priority === 'HIGH' ? 48 : 72;
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + slaHours);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        merchantId: req.user.merchantId,
        userId: req.user.id,
        orderId: order?.id || null,
        type: data.type,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: 'OPEN',
        slaHours,
        dueAt,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
});

// List tickets (customer - their own tickets)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      return res.json({ tickets: [] });
    }

    const { status, priority, type } = req.query;

    const where: any = {
      merchantId: req.user.merchantId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate SLA status
    const ticketsWithSLA = tickets.map(ticket => {
      const now = new Date();
      const hoursRemaining = Math.max(0, Math.ceil((ticket.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
      const isOverdue = ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.dueAt < now;

      return {
        ...ticket,
        sla: isOverdue 
          ? 'Overdue' 
          : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
          ? 'Resolved'
          : `${hoursRemaining} hours remaining`,
      };
    });

    res.json({ tickets: ticketsWithSLA });
  } catch (error) {
    next(error);
  }
});

// Get single ticket
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
      include: {
        order: {
          include: {
            warehouse: true,
            trackingEvents: {
              orderBy: { timestamp: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Update ticket (admin only - for resolving)
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    // Check if user is admin
    const isAdmin = req.user?.email === 'admin@admin.com' || req.user?.role === 'ADMIN';

    if (!isAdmin) {
      throw new AppError(403, 'Admin access required');
    }

    const data = UpdateTicketSchema.parse(req.body);

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
      
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user?.id;
      }
    }

    if (data.resolution) {
      updateData.resolution = data.resolution;
    }

    if (data.priority) {
      updateData.priority = data.priority;
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
          },
        },
        merchant: {
          select: {
            companyName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
});

export const ticketsRouter = router;
