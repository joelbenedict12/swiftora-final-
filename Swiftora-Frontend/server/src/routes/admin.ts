import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

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

export const adminRouter = router;
