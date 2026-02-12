import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import * as InvoiceService from '../services/InvoiceService.js';
import * as ProfitService from '../services/ProfitService.js';
import * as WalletService from '../services/WalletService.js';

const router = Router();

// Middleware to check if user is admin
const requireAdmin = async (req: AuthRequest, res: any, next: any) => {
    if (!req.user || req.user.email !== 'admin@admin.com') {
        throw new AppError(403, 'Admin access required');
    }
    next();
};

// Get dashboard stats
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const [usersCount, merchantsCount, ordersCount, revenueResult] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.merchant.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: { productValue: true },
                where: { status: { in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PROCESSING'] } },
            }),
        ]);

        res.json({
            totalUsers: usersCount,
            activeVendors: merchantsCount,
            totalOrders: ordersCount,
            totalRevenue: Number(revenueResult._sum?.productValue) || 0,
        });
    } catch (error) {
        next(error);
    }
});

// Get orders growth chart data (last 6 months)
router.get('/orders-chart', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true },
        });

        // Group by month
        const monthlyData: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = months[date.getMonth()];
            monthlyData[key] = 0;
        }

        // Count orders per month
        orders.forEach(order => {
            const month = months[order.createdAt.getMonth()];
            if (monthlyData[month] !== undefined) {
                monthlyData[month]++;
            }
        });

        const chartData = Object.entries(monthlyData).map(([name, orders]) => ({
            name,
            orders,
        }));

        res.json(chartData);
    } catch (error) {
        next(error);
    }
});

// Get revenue chart data (last 6 months)
router.get('/revenue-chart', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: sixMonthsAgo },
                status: { in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PROCESSING'] },
            },
            select: { createdAt: true, productValue: true },
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData: Record<string, number> = {};

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = months[date.getMonth()];
            monthlyData[key] = 0;
        }

        // Sum revenue per month
        orders.forEach(order => {
            const month = months[order.createdAt.getMonth()];
            if (monthlyData[month] !== undefined) {
                monthlyData[month] += Number(order.productValue) || 0;
            }
        });

        const chartData = Object.entries(monthlyData).map(([name, revenue]) => ({
            name,
            revenue,
        }));

        res.json(chartData);
    } catch (error) {
        next(error);
    }
});

// Get recent orders
router.get('/recent-orders', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                merchant: { select: { companyName: true } },
            },
        });

        const recentActivity = orders.map(order => ({
            id: order.orderNumber || order.id.slice(-8),
            user: order.customerName || 'Unknown',
            vendor: order.merchant?.companyName || 'Direct',
            amount: `₹${Number(order.productValue || 0).toLocaleString()}`,
            status: order.status === 'OUT_FOR_DELIVERY' ? 'Completed' :
                order.status === 'IN_TRANSIT' ? 'Shipped' :
                    order.status === 'CANCELLED' ? 'Cancelled' : 'Pending',
        }));

        res.json(recentActivity);
    } catch (error) {
        next(error);
    }
});

// Get all users (admin)
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                merchant: { select: { companyName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
});

// Get all vendors/merchants (admin)
router.get('/vendors', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const merchants = await prisma.merchant.findMany({
            include: {
                _count: { select: { orders: true, users: true, warehouses: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const vendors = merchants.map(m => ({
            id: m.id,
            companyName: m.companyName,
            email: m.email,
            phone: m.phone,
            walletBalance: m.walletBalance,
            orderCount: m._count.orders,
            userCount: m._count.users,
            warehouseCount: m._count.warehouses,
            createdAt: m.createdAt,
        }));

        res.json(vendors);
    } catch (error) {
        next(error);
    }
});

// Get all tickets (admin)
router.get('/tickets', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { status, priority, type } = req.query;

        const where: any = {};

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
                merchant: {
                    select: {
                        companyName: true,
                        email: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                order: {
                    select: {
                        orderNumber: true,
                        customerName: true,
                        status: true,
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

// Update ticket (admin - resolve)
router.put('/tickets/:id', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { status, resolution, priority } = req.body;

        const updateData: any = {};

        if (status) {
            updateData.status = status;

            if (status === 'RESOLVED' || status === 'CLOSED') {
                updateData.resolvedAt = new Date();
                updateData.resolvedBy = req.user!.id;
            }
        }

        if (resolution) {
            updateData.resolution = resolution;
        }

        if (priority) {
            updateData.priority = priority;
        }

        const ticket = await prisma.ticket.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                merchant: {
                    select: {
                        companyName: true,
                        email: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                order: {
                    select: {
                        orderNumber: true,
                        customerName: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// RATE CARD MANAGEMENT
// ============================================================

// List all rate cards
router.get('/rate-cards', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { accountType, courierName } = req.query;
        const where: any = {};
        if (accountType) where.accountType = accountType;
        if (courierName) where.courierName = courierName;

        const rateCards = await prisma.rateCard.findMany({
            where,
            orderBy: [{ accountType: 'asc' }, { courierName: 'asc' }, { minWeight: 'asc' }],
        });

        res.json({ rateCards });
    } catch (error) {
        next(error);
    }
});

// Create rate card
router.post('/rate-cards', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { accountType, courierName, marginType, marginValue, minWeight, maxWeight } = req.body;

        if (!accountType || !courierName || !marginType || marginValue === undefined) {
            throw new AppError(400, 'accountType, courierName, marginType, and marginValue are required');
        }

        if (!['B2B', 'B2C'].includes(accountType)) {
            throw new AppError(400, 'accountType must be B2B or B2C');
        }

        if (!['flat', 'percentage'].includes(marginType)) {
            throw new AppError(400, 'marginType must be flat or percentage');
        }

        const rateCard = await prisma.rateCard.create({
            data: {
                accountType,
                courierName,
                marginType,
                marginValue: Number(marginValue),
                minWeight: minWeight ? Number(minWeight) : null,
                maxWeight: maxWeight ? Number(maxWeight) : null,
            },
        });

        res.status(201).json({ success: true, rateCard });
    } catch (error) {
        next(error);
    }
});

// Update rate card
router.put('/rate-cards/:id', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { marginType, marginValue, minWeight, maxWeight, isActive } = req.body;

        const data: any = {};
        if (marginType) data.marginType = marginType;
        if (marginValue !== undefined) data.marginValue = Number(marginValue);
        if (minWeight !== undefined) data.minWeight = minWeight ? Number(minWeight) : null;
        if (maxWeight !== undefined) data.maxWeight = maxWeight ? Number(maxWeight) : null;
        if (isActive !== undefined) data.isActive = isActive;

        const rateCard = await prisma.rateCard.update({
            where: { id: req.params.id },
            data,
        });

        res.json({ success: true, rateCard });
    } catch (error) {
        next(error);
    }
});

// Delete rate card
router.delete('/rate-cards/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        await prisma.rateCard.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// INVOICE MANAGEMENT
// ============================================================

// List invoices
router.get('/invoices', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { merchantId, status, page, limit } = req.query;
        const result = await InvoiceService.listInvoices({
            merchantId: merchantId as string,
            status: status as string,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Generate invoice for a vendor
router.post('/invoices/generate', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { merchantId, month, year } = req.body;

        if (!merchantId || !month || !year) {
            throw new AppError(400, 'merchantId, month, and year are required');
        }

        const result = await InvoiceService.generateMonthlyInvoice(merchantId, Number(month), Number(year));

        if (!result.success) {
            throw new AppError(400, result.error || 'Failed to generate invoice');
        }

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// Update invoice status
router.patch('/invoices/:id', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            throw new AppError(400, 'status is required');
        }

        const invoice = await InvoiceService.updateInvoiceStatus(req.params.id, status);
        res.json({ success: true, invoice });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// WALLET MANAGEMENT
// ============================================================

// Get vendor wallet balance
router.get('/wallet/:merchantId', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const balance = await WalletService.getBalance(req.params.merchantId);
        res.json(balance);
    } catch (error) {
        next(error);
    }
});

// Credit vendor wallet (admin adds funds)
// TODO: Integrate PayU payment gateway here for actual payment processing
// PayU webhook will call this endpoint after successful payment verification
router.post('/wallet/credit', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { merchantId, amount, description, reference } = req.body;

        if (!merchantId || !amount || amount <= 0) {
            throw new AppError(400, 'merchantId and a positive amount are required');
        }

        // TODO: When PayU is integrated:
        // 1. Verify payment with PayU transaction ID
        // 2. Check PayU webhook signature
        // 3. Only credit after verified payment
        // For now, admin can manually credit wallets

        const result = await WalletService.credit(
            merchantId,
            Number(amount),
            description || 'Admin wallet credit',
            reference
        );

        if (!result.success) {
            throw new AppError(400, result.error || 'Failed to credit wallet');
        }

        res.json({
            success: true,
            transactionId: result.transactionId,
            balanceBefore: result.balanceBefore,
            balanceAfter: result.balanceAfter,
        });
    } catch (error) {
        next(error);
    }
});

// Get wallet transactions for a vendor
router.get('/wallet/:merchantId/transactions', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { page, limit, type } = req.query;
        const result = await WalletService.getTransactions(req.params.merchantId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            type: type as string,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// ============================================================
// PROFIT & LOSS ANALYTICS
// ============================================================

// Get P&L analytics
router.get('/analytics/profit', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const [summary, byCourier, byVendor] = await Promise.all([
            ProfitService.getTotalProfitByDateRange(start, end),
            ProfitService.getProfitByCourier(start, end),
            ProfitService.getProfitByVendor(start, end),
        ]);

        res.json({
            summary,
            byCourier,
            byVendor,
        });
    } catch (error) {
        next(error);
    }
});

export const adminRouter = router;
