import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ─── Helper: Auto-create COD remittance on delivery ───
export async function createCodRemittanceIfNeeded(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { codRemittance: true },
    });

    if (!order) return;
    if (order.paymentMode !== 'COD') return;
    if (order.status !== 'DELIVERED') return;
    if (order.codRemittance) return; // already exists

    await prisma.codRemittance.create({
        data: {
            merchantId: order.merchantId,
            orderId: order.id,
            awbNumber: order.awbNumber || '',
            courierPartner: order.courierName || 'Unknown',
            codAmount: order.codAmount || 0,
            courierCharges: 0,
            platformFee: 0,
            netPayable: order.codAmount || 0,
            status: 'PENDING',
        },
    });
}

// ─── Vendor: Get COD remittance stats ───
router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const merchantId = req.user?.merchantId;
        if (!merchantId) return next(new AppError(403, 'No merchant linked'));

        const remittances = await prisma.codRemittance.findMany({
            where: { merchantId },
        });

        const totalCod = remittances.reduce((s, r) => s + Number(r.codAmount), 0);
        const totalPending = remittances.filter(r => r.status === 'PENDING' || r.status === 'RECEIVED_FROM_COURIER')
            .reduce((s, r) => s + Number(r.netPayable), 0);
        const totalPaid = remittances.filter(r => r.status === 'PAID_TO_VENDOR')
            .reduce((s, r) => s + Number(r.netPayable), 0);
        const totalPlatformFee = remittances.reduce((s, r) => s + Number(r.platformFee), 0);
        const totalCourierCharges = remittances.reduce((s, r) => s + Number(r.courierCharges), 0);

        res.json({
            totalCod,
            totalPending,
            totalPaid,
            totalPlatformFee,
            totalCourierCharges,
            totalRecords: remittances.length,
        });
    } catch (err) {
        next(err);
    }
});

// ─── Vendor: List COD remittances ───
router.get('/list', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const merchantId = req.user?.merchantId;
        if (!merchantId) return next(new AppError(403, 'No merchant linked'));

        const { status, courier, startDate, endDate, search, page = '1', limit = '20' } = req.query as Record<string, string>;
        const where: any = { merchantId };

        if (status && status !== 'all') where.status = status;
        if (courier && courier !== 'all') where.courierPartner = courier;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');
        }
        if (search) {
            where.OR = [
                { awbNumber: { contains: search, mode: 'insensitive' } },
                { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [remittances, total] = await Promise.all([
            prisma.codRemittance.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            customerName: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.codRemittance.count({ where }),
        ]);

        res.json({ remittances, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        next(err);
    }
});

// ─── Admin middleware ───
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
    if (!req.user || (req.user.email !== 'admin@admin.com' && req.user.role !== 'ADMIN')) {
        return next(new AppError(403, 'Admin access required'));
    }
    next();
};

// ─── Admin: Platform-wide COD stats ───
router.get('/admin/stats', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const remittances = await prisma.codRemittance.findMany();

        const totalCod = remittances.reduce((s, r) => s + Number(r.codAmount), 0);
        const pendingSettlement = remittances.filter(r => r.status !== 'PAID_TO_VENDOR')
            .reduce((s, r) => s + Number(r.netPayable), 0);
        const platformEarnings = remittances.reduce((s, r) => s + Number(r.platformFee), 0);
        const totalPaid = remittances.filter(r => r.status === 'PAID_TO_VENDOR')
            .reduce((s, r) => s + Number(r.netPayable), 0);

        res.json({ totalCod, pendingSettlement, platformEarnings, totalPaid, totalRecords: remittances.length });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: List all COD remittances ───
router.get('/admin/list', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { status, courier, merchantId, startDate, endDate, search, page = '1', limit = '20' } = req.query as Record<string, string>;
        const where: any = {};

        if (status && status !== 'all') where.status = status;
        if (courier && courier !== 'all') where.courierPartner = courier;
        if (merchantId && merchantId !== 'all') where.merchantId = merchantId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');
        }
        if (search) {
            where.OR = [
                { awbNumber: { contains: search, mode: 'insensitive' } },
                { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [remittances, total] = await Promise.all([
            prisma.codRemittance.findMany({
                where,
                include: {
                    order: {
                        select: { orderNumber: true, customerName: true, status: true },
                    },
                    merchant: {
                        select: { companyName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.codRemittance.count({ where }),
        ]);

        res.json({ remittances, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: Mark as RECEIVED_FROM_COURIER ───
router.put('/admin/:id/receive', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { courierCharges = 0, platformFee = 0 } = req.body;

        const remittance = await prisma.codRemittance.findUnique({ where: { id } });
        if (!remittance) return next(new AppError(404, 'Remittance not found'));
        if (remittance.status !== 'PENDING') return next(new AppError(400, 'Can only receive PENDING remittances'));

        const netPayable = Number(remittance.codAmount) - Number(courierCharges) - Number(platformFee);

        const updated = await prisma.codRemittance.update({
            where: { id },
            data: {
                status: 'RECEIVED_FROM_COURIER',
                courierCharges,
                platformFee,
                netPayable: Math.max(0, netPayable),
            },
        });

        res.json({ message: 'Marked as received from courier', remittance: updated });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: Mark as PAID_TO_VENDOR ───
router.put('/admin/:id/pay', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { transactionId, remittanceRef } = req.body;

        const remittance = await prisma.codRemittance.findUnique({ where: { id } });
        if (!remittance) return next(new AppError(404, 'Remittance not found'));
        if (remittance.status !== 'RECEIVED_FROM_COURIER') return next(new AppError(400, 'Must be RECEIVED_FROM_COURIER first'));

        const updated = await prisma.codRemittance.update({
            where: { id },
            data: {
                status: 'PAID_TO_VENDOR',
                transactionId: transactionId || null,
                remittanceRef: remittanceRef || null,
                transferDate: new Date(),
            },
        });

        res.json({ message: 'Marked as paid to vendor', remittance: updated });
    } catch (err) {
        next(err);
    }
});

export default router;
