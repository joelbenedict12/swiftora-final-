/**
 * REVERSE SHIPMENT API ROUTES
 * 
 * POST /api/reverse/:orderId       — Initiate reverse pickup for forward order
 * GET  /api/reverse                — List reverse shipments
 * GET  /api/reverse/:orderId       — Get reverse shipment detail
 * POST /api/reverse/:orderId/cancel — Cancel reverse shipment
 */
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { createReverseShipment } from '../services/ReverseShipmentService.js';
import { getQcCharge } from '../services/commissionService.js';

const router = Router();
router.use(authenticate);

// ── QC Settings (for frontend) ───────────────────────────────
router.get('/settings', async (_req: AuthRequest, res, next) => {
    try {
        const qcCharge = await getQcCharge();
        res.json({ qcCharge });
    } catch (e) { next(e); }
});

// ── Initiate Reverse Pickup ──────────────────────────────────
router.post('/:orderId', async (req: AuthRequest, res, next) => {
    try {
        const { reason, pickupDate, phone, address, qcRequired } = req.body;
        if (!reason) throw new AppError(400, 'Reverse reason is required');

        // Verify order belongs to this vendor (or admin)
        const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
        if (!order) throw new AppError(404, 'Order not found');

        if (req.user?.role !== 'ADMIN' && order.merchantId !== req.user?.merchantId) {
            throw new AppError(403, 'Forbidden');
        }

        const result = await createReverseShipment(
            { forwardOrderId: req.params.orderId, reason, pickupDate, phone, address, qcRequired: qcRequired === true },
            req.user?.id,
        );

        res.json(result);
    } catch (e) { next(e); }
});

// ── List Reverse Shipments ───────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
    try {
        const { page = '1', limit = '20', status } = req.query;
        const isAdmin = req.user?.role === 'ADMIN';

        const where: any = { shipmentType: 'REVERSE' };
        if (!isAdmin) {
            if (!req.user?.merchantId) return res.json({ orders: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
            where.merchantId = req.user.merchantId;
        }
        if (status) where.status = String(status).toUpperCase();

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    parentOrder: {
                        select: { orderNumber: true, awbNumber: true, courierName: true, customerName: true },
                    },
                    warehouse: { select: { name: true, city: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.order.count({ where }),
        ]);

        res.json({
            orders,
            pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / take) },
        });
    } catch (e) { next(e); }
});

// ── Reverse Shipment Detail ──────────────────────────────────
router.get('/:orderId', async (req: AuthRequest, res, next) => {
    try {
        // Check if this is a reverse shipment by orderId, or find reverse for a forward orderId
        let reverse = await prisma.order.findFirst({
            where: { id: req.params.orderId, shipmentType: 'REVERSE' },
            include: {
                parentOrder: {
                    select: { orderNumber: true, awbNumber: true, courierName: true, customerName: true, customerPhone: true, shippingAddress: true, shippingCity: true, status: true },
                },
                warehouse: true,
            },
        });

        if (!reverse) {
            // Maybe the user passed forward orderId — find its reverse
            reverse = await prisma.order.findFirst({
                where: { parentOrderId: req.params.orderId, shipmentType: 'REVERSE' },
                include: {
                    parentOrder: {
                        select: { orderNumber: true, awbNumber: true, courierName: true, customerName: true, customerPhone: true, shippingAddress: true, shippingCity: true, status: true },
                    },
                    warehouse: true,
                },
            });
        }

        if (!reverse) throw new AppError(404, 'Reverse shipment not found');

        if (req.user?.role !== 'ADMIN' && reverse.merchantId !== req.user?.merchantId) {
            throw new AppError(403, 'Forbidden');
        }

        res.json(reverse);
    } catch (e) { next(e); }
});

// ── Cancel Reverse Shipment ──────────────────────────────────
router.post('/:orderId/cancel', async (req: AuthRequest, res, next) => {
    try {
        const reverse = await prisma.order.findFirst({
            where: { id: req.params.orderId, shipmentType: 'REVERSE' },
        });

        if (!reverse) throw new AppError(404, 'Reverse shipment not found');

        if (req.user?.role !== 'ADMIN' && reverse.merchantId !== req.user?.merchantId) {
            throw new AppError(403, 'Forbidden');
        }

        if (['DELIVERED', 'CANCELLED'].includes(reverse.status)) {
            throw new AppError(400, `Cannot cancel reverse shipment in ${reverse.status} status`);
        }

        await prisma.order.update({
            where: { id: reverse.id },
            data: { status: 'CANCELLED' },
        });

        res.json({ success: true, message: 'Reverse shipment cancelled' });
    } catch (e) { next(e); }
});

export const reverseRouter = router;
