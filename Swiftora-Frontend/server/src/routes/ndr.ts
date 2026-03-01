/**
 * NDR API ROUTES
 * 
 * GET  /api/ndr              — List NDR cases (vendor sees own, admin sees all)
 * GET  /api/ndr/stats         — NDR stats (vendor)
 * GET  /api/ndr/admin/stats   — NDR stats (admin — platform-wide)
 * GET  /api/ndr/:orderId      — Single NDR case detail
 * POST /api/ndr/:orderId/action — Take NDR action (reattempt/rto/update_address/update_phone/reschedule)
 */
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { handleNdrAction, SUPPORTED_ACTIONS } from '../services/NdrService.js';

const router = Router();
router.use(authenticate);

// ── Vendor Stats ──────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res, next) => {
    try {
        if (!req.user?.merchantId) return res.json({ total: 0, pending: 0, resolved: 0, ndrRate: 0 });

        const [total, pending, resolved, totalOrders] = await Promise.all([
            prisma.ndrCase.count({ where: { order: { merchantId: req.user.merchantId } } }),
            prisma.ndrCase.count({ where: { order: { merchantId: req.user.merchantId }, resolved: false } }),
            prisma.ndrCase.count({ where: { order: { merchantId: req.user.merchantId }, resolved: true } }),
            prisma.order.count({ where: { merchantId: req.user.merchantId } }),
        ]);

        res.json({ total, pending, resolved, ndrRate: totalOrders > 0 ? ((total / totalOrders) * 100).toFixed(1) : '0.0' });
    } catch (e) { next(e); }
});

// ── Admin Stats ───────────────────────────────────────────────
router.get('/admin/stats', async (req: AuthRequest, res, next) => {
    try {
        if (req.user?.role !== 'ADMIN') throw new AppError(403, 'Admin only');

        const [total, pending, resolved, totalOrders] = await Promise.all([
            prisma.ndrCase.count(),
            prisma.ndrCase.count({ where: { resolved: false } }),
            prisma.ndrCase.count({ where: { resolved: true } }),
            prisma.order.count(),
        ]);

        res.json({ total, pending, resolved, ndrRate: totalOrders > 0 ? ((total / totalOrders) * 100).toFixed(1) : '0.0' });
    } catch (e) { next(e); }
});

// ── List NDR Cases ────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
    try {
        const { courier, resolved, page = '1', limit = '20' } = req.query;
        const isAdmin = req.user?.role === 'ADMIN';

        const where: any = {};

        // Vendor sees own only
        if (!isAdmin) {
            if (!req.user?.merchantId) return res.json({ cases: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
            where.order = { merchantId: req.user.merchantId };
        }

        if (courier) where.courierName = String(courier).toUpperCase();
        if (resolved === 'true') where.resolved = true;
        else if (resolved === 'false') where.resolved = false;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [cases, total] = await Promise.all([
            prisma.ndrCase.findMany({
                where,
                include: {
                    order: {
                        select: { orderNumber: true, customerName: true, customerPhone: true, shippingAddress: true, shippingCity: true, shippingPincode: true, status: true, merchantId: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.ndrCase.count({ where }),
        ]);

        res.json({
            cases,
            pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / take) },
        });
    } catch (e) { next(e); }
});

// ── Single NDR Case ───────────────────────────────────────────
router.get('/:orderId', async (req: AuthRequest, res, next) => {
    try {
        const ndr = await prisma.ndrCase.findUnique({
            where: { orderId: req.params.orderId },
            include: {
                order: {
                    select: { orderNumber: true, customerName: true, customerPhone: true, shippingAddress: true, shippingCity: true, shippingState: true, shippingPincode: true, status: true, merchantId: true, paymentMode: true, codAmount: true },
                },
            },
        });

        if (!ndr) throw new AppError(404, 'NDR case not found');

        // Vendor can only see own
        if (req.user?.role !== 'ADMIN' && ndr.order.merchantId !== req.user?.merchantId) {
            throw new AppError(403, 'Forbidden');
        }

        const supported = SUPPORTED_ACTIONS[ndr.courierName.toUpperCase()] || [];
        res.json({ ...ndr, supportedActions: supported });
    } catch (e) { next(e); }
});

// ── Take NDR Action ───────────────────────────────────────────
router.post('/:orderId/action', async (req: AuthRequest, res, next) => {
    try {
        const { action, payload } = req.body;
        if (!action) throw new AppError(400, 'action is required');

        const ndr = await prisma.ndrCase.findUnique({
            where: { orderId: req.params.orderId },
            include: { order: { select: { merchantId: true, status: true, awbNumber: true, courierName: true, orderNumber: true } } },
        });

        if (!ndr) throw new AppError(404, 'NDR case not found');

        // Vendor can only act on own
        if (req.user?.role !== 'ADMIN' && ndr.order.merchantId !== req.user?.merchantId) {
            throw new AppError(403, 'Forbidden');
        }

        if (ndr.resolved) throw new AppError(400, 'NDR case is already resolved');

        // Call courier API
        const result = await handleNdrAction({
            courier: ndr.courierName,
            awbNumber: ndr.awbNumber,
            action: action.toLowerCase(),
            payload,
        });

        // Update NDR case
        await prisma.ndrCase.update({
            where: { id: ndr.id },
            data: {
                actionTaken: action.toLowerCase(),
                actionPayload: payload || {},
                courierResponse: result.raw || {},
                resolved: result.success && (action.toLowerCase() === 'rto'),
            },
        });

        // If RTO and success, update order status
        if (result.success && action.toLowerCase() === 'rto') {
            await prisma.order.update({
                where: { id: req.params.orderId },
                data: { status: 'RTO' },
            });
        }

        // If reattempt and success, set back to OUT_FOR_DELIVERY
        if (result.success && ['reattempt', 'reschedule'].includes(action.toLowerCase())) {
            await prisma.order.update({
                where: { id: req.params.orderId },
                data: { status: 'OUT_FOR_DELIVERY' },
            });
        }

        res.json({
            success: result.success,
            message: result.message,
            ndrCase: await prisma.ndrCase.findUnique({ where: { id: ndr.id } }),
        });
    } catch (e) { next(e); }
});

export const ndrRouter = router;
