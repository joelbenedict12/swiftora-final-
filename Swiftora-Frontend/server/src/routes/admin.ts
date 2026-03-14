import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import * as InvoiceService from '../services/InvoiceService.js';
import * as AnalyticsService from '../services/analyticsService.js';
import * as WalletService from '../services/WalletService.js';
import * as CommissionService from '../services/commissionService.js';
import * as BillingService from '../services/billingService.js';

const router = Router();

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
    if (!req.user || (req.user.email !== 'admin@admin.com' && req.user.role !== 'ADMIN')) {
        return next(new AppError(403, 'Admin access required'));
    }
    next();
};

// Get dashboard stats (legacy — kept for backward compat)
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const [usersCount, merchantsCount, ordersCount, revenueResult] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.merchant.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: { vendorCharge: true },
                where: { status: { in: ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] } },
            }),
        ]);

        res.json({
            totalUsers: usersCount,
            activeVendors: merchantsCount,
            totalOrders: ordersCount,
            totalRevenue: Number(revenueResult._sum?.vendorCharge) || 0,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// ENHANCED DASHBOARD STATS
// ============================================================

router.get('/dashboard-stats', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const shippedStatuses: any = ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

        const [
            totalUsers,
            totalVendors,
            shipmentsToday,
            shipmentsThisMonth,
            revenueThisMonth,
            totalRevenue,
            commissionResult,
            walletAgg,
            creditOutstanding,
        ] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.merchant.count(),
            prisma.order.count({
                where: { shippedAt: { gte: todayStart }, status: { in: shippedStatuses } } as any,
            }),
            prisma.order.count({
                where: { shippedAt: { gte: monthStart }, status: { in: shippedStatuses } } as any,
            }),
            prisma.order.aggregate({
                _sum: { vendorCharge: true },
                where: { shippedAt: { gte: monthStart }, status: { in: shippedStatuses } } as any,
            }),
            prisma.order.aggregate({
                _sum: { vendorCharge: true, margin: true },
                where: { status: { in: shippedStatuses } } as any,
            }),
            prisma.order.aggregate({
                _sum: { margin: true },
                where: { status: { in: shippedStatuses } } as any,
            }),
            prisma.merchant.aggregate({
                _sum: { walletBalance: true },
            } as any),
            prisma.creditLedger.aggregate({
                _sum: { shippingCost: true },
            } as any),
        ]);

        // Calculate paid credit to get net outstanding
        const paidCredit = await (prisma as any).monthlyInvoice.aggregate({
            _sum: { totalPayable: true },
            where: { isPaid: true },
        });

        const totalOutstanding = Math.max(0,
            (Number(creditOutstanding._sum?.shippingCost) || 0) -
            (Number(paidCredit._sum?.totalPayable) || 0)
        );

        res.json({
            totalUsers,
            totalVendors,
            shipmentsToday,
            shipmentsThisMonth,
            revenueThisMonth: Number(revenueThisMonth._sum?.vendorCharge) || 0,
            totalRevenue: Number(totalRevenue._sum?.vendorCharge) || 0,
            totalCommission: Number(commissionResult._sum?.margin) || 0,
            totalWalletBalance: Number(walletAgg._sum?.walletBalance) || 0,
            totalOutstandingCredit: totalOutstanding,
        });
    } catch (error) {
        next(error);
    }
});

// Shipments by courier (for pie chart)
router.get('/courier-distribution', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const shippedStatuses: any = ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        const orders = await prisma.order.groupBy({
            by: ['courierName'],
            where: {
                courierName: { not: null },
                status: { in: shippedStatuses },
            },
            _count: { id: true },
            _sum: { vendorCharge: true },
        });

        const data = orders
            .filter((o: any) => o.courierName)
            .map((o: any) => ({
                courier: o.courierName!,
                count: o._count?.id || 0,
                revenue: Number(o._sum?.vendorCharge) || 0,
            }))
            .sort((a, b) => b.count - a.count);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Top 5 customers by revenue (for bar chart)
router.get('/top-customers', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const shippedStatuses: any = ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        const topMerchants = await prisma.order.groupBy({
            by: ['merchantId'],
            where: { status: { in: shippedStatuses } },
            _sum: { vendorCharge: true },
            _count: { id: true },
            orderBy: { _sum: { vendorCharge: 'desc' } },
            take: 5,
        });

        const merchantIds = topMerchants.map(m => m.merchantId);
        const merchants = await prisma.merchant.findMany({
            where: { id: { in: merchantIds } },
            select: { id: true, companyName: true },
        });

        const nameMap = new Map(merchants.map(m => [m.id, m.companyName]));

        const data = topMerchants.map((m: any) => ({
            name: nameMap.get(m.merchantId) || 'Unknown',
            revenue: Number(m._sum?.vendorCharge) || 0,
            orders: m._count?.id || 0,
        }));

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Per-vendor analytics deep-dive
router.get('/vendors/:id/analytics', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const merchantId = req.params.id;

        const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: {
                id: true, companyName: true, email: true, phone: true,
                walletBalance: true, creditLimit: true,
                isPaused: true, createdAt: true,
                address: true, city: true, state: true, pincode: true,
                orderIdPrefix: true, customerType: true,
            } as any,
        });

        if (!merchant) throw new AppError(404, 'Vendor not found');

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const shippedStatuses: any = ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

        const [
            totalOrders,
            ordersThisMonth,
            revenueAgg,
            commissionAgg,
            deliveredCount,
            cancelledCount,
            pendingCount,
            inTransitCount,
            pickedUpCount,
            outForDeliveryCount,
            courierBreakdown,
            creditUsed,
            transactions,
            warehouses,
            recentOrders,
        ] = await Promise.all([
            prisma.order.count({ where: { merchantId } }),
            prisma.order.count({ where: { merchantId, createdAt: { gte: monthStart } } }),
            prisma.order.aggregate({
                _sum: { vendorCharge: true },
                where: { merchantId, status: { in: shippedStatuses } } as any,
            }),
            prisma.order.aggregate({
                _sum: { margin: true },
                _avg: { vendorCharge: true },
                where: { merchantId, status: { in: shippedStatuses } } as any,
            }),
            prisma.order.count({ where: { merchantId, status: 'DELIVERED' } }),
            prisma.order.count({ where: { merchantId, status: 'CANCELLED' } }),
            prisma.order.count({ where: { merchantId, status: { in: ['PENDING', 'READY_TO_SHIP'] } } }),
            prisma.order.count({ where: { merchantId, status: { in: ['IN_TRANSIT', 'MANIFESTED'] } } }),
            prisma.order.count({ where: { merchantId, status: 'PICKED_UP' } }),
            prisma.order.count({ where: { merchantId, status: 'OUT_FOR_DELIVERY' } }),
            prisma.order.groupBy({
                by: ['courierName'],
                where: { merchantId, courierName: { not: null }, status: { in: shippedStatuses } } as any,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),
            (prisma as any).creditLedger.aggregate({
                _sum: { shippingCost: true },
                where: { merchantId },
            }),
            prisma.walletTransaction.findMany({
                where: { merchantId },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    id: true, amount: true, type: true, status: true,
                    description: true, reference: true,
                    balanceBefore: true, balanceAfter: true, createdAt: true,
                },
            }),
            prisma.warehouse.findMany({
                where: { merchantId },
                select: {
                    id: true, name: true, address: true, city: true,
                    state: true, pincode: true, phone: true, contactPerson: true,
                    isDefault: true,
                },
            }),
            prisma.order.findMany({
                where: { merchantId },
                select: {
                    id: true, orderNumber: true, awbNumber: true, status: true,
                    courierName: true, customerName: true, shippingPincode: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ]);

        const totalRevenue = Number(revenueAgg._sum?.vendorCharge) || 0;
        const totalCommission = Number(commissionAgg._sum?.margin) || 0;
        const avgShippingCost = Number(commissionAgg._avg?.vendorCharge) || 0;
        const usedCredit = Number(creditUsed._sum?.shippingCost) || 0;
        const customerType = (merchant as any).customerType || 'CASH';
        // Determine health status
        let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
        if (merchant.isPaused) {
            healthStatus = 'CRITICAL';
        } else if (customerType === 'CREDIT') {
            const creditLimit = Number(merchant.creditLimit) || 0;
            if (creditLimit > 0 && usedCredit >= creditLimit) {
                healthStatus = 'CRITICAL';
            } else if (creditLimit > 0 && usedCredit >= creditLimit * 0.8) {
                healthStatus = 'WARNING';
            }
        } else {
            const balance = Number(merchant.walletBalance) || 0;
            if (balance <= 0) healthStatus = 'CRITICAL';
            else if (balance < 100) healthStatus = 'WARNING';
        }

        const topCourier = courierBreakdown.length > 0
            ? courierBreakdown[0].courierName
            : null;

        res.json({
            merchant: {
                ...merchant,
                customerType,
                walletBalance: Number(merchant.walletBalance),
                creditLimit: Number(merchant.creditLimit),
            },
            financial: {
                walletBalance: Number(merchant.walletBalance),
                creditLimit: Number(merchant.creditLimit),
                usedCredit,
                outstandingAmount: Math.max(0, usedCredit),
                totalRevenue,
                totalCommission,
                healthStatus,
            },
            shipments: {
                totalOrders,
                ordersThisMonth,
                topCourier,
                totalShippingValue: totalRevenue,
                avgShippingCost: Math.round(avgShippingCost * 100) / 100,
                delivered: deliveredCount,
                cancelled: cancelledCount,
                pending: pendingCount,
                inTransit: inTransitCount,
                pickedUp: pickedUpCount,
                outForDelivery: outForDeliveryCount,
                courierBreakdown: courierBreakdown.map((c: any) => ({
                    courier: c.courierName,
                    count: c._count.id,
                })),
            },
            transactions: transactions.map((t: any) => ({
                id: t.id,
                date: t.createdAt,
                type: t.type,
                status: t.status,
                amount: Number(t.amount),
                balanceAfter: Number(t.balanceAfter),
                description: t.description,
                reference: t.reference,
            })),
            warehouses,
            recentOrders: recentOrders.map((o: any) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                awbNumber: o.awbNumber,
                status: o.status,
                courierName: o.courierName,
                customerName: o.customerName,
                deliveryPincode: o.shippingPincode,
                date: o.createdAt,
            })),
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
                status: { in: ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
            },
            select: { createdAt: true, vendorCharge: true },
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
                monthlyData[month] += Number(order.vendorCharge) || 0;
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

// Update user role (admin)
router.put('/users/:id/role', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { role } = req.body;
        const validRoles = ['USER', 'MANAGER', 'SUPPORT', 'ADMIN', 'VIEWER'];

        if (!role || !validRoles.includes(role)) {
            throw new AppError(400, `role must be one of: ${validRoles.join(', ')}`);
        }

        // Prevent changing own role
        if (req.params.id === req.user!.id) {
            throw new AppError(400, 'Cannot change your own role');
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role: role as any },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});

// Get all SUPPORT users (for ticket assignment dropdown)
router.get('/support-users', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const supportUsers = await prisma.user.findMany({
            where: { role: 'SUPPORT', isActive: true },
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        assignedTickets: {
                            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({ users: supportUsers });
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
            isPaused: m.isPaused,
            customerType: m.customerType,
            creditLimit: m.creditLimit,
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
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                notes: {
                    include: {
                        user: {
                            select: { name: true, email: true, role: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' as const },
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

// Assign ticket to a SUPPORT user (admin only)
router.put('/tickets/:id/assign', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { assignedTo } = req.body;

        // Allow unassigning (null)
        if (assignedTo !== null && assignedTo !== undefined) {
            // Verify the target user exists and is a SUPPORT user
            const supportUser = await prisma.user.findFirst({
                where: { id: assignedTo, role: 'SUPPORT', isActive: true },
            });

            if (!supportUser) {
                throw new AppError(400, 'Target user is not a valid active SUPPORT user');
            }
        }

        const ticket = await prisma.ticket.update({
            where: { id: req.params.id },
            data: { assignedTo: assignedTo || null },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true },
                },
                merchant: {
                    select: { companyName: true, email: true },
                },
            },
        });

        res.json({ success: true, ticket });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// RATE CARD MANAGEMENT
// ============================================================

// Calculate live shipping rate from Delhivery API (must be before /rate-cards list route)
router.get('/rate-cards/calculate', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { origin_pin, destination_pin, weight, payment_mode, cod_amount } = req.query;

        if (!origin_pin || !destination_pin || !weight) {
            return res.status(400).json({
                success: false,
                error: 'origin_pin, destination_pin, and weight are required',
            });
        }

        // Dynamically import Delhivery service
        const { calculateRate } = await import('../services/delhivery.js');

        const result = await calculateRate({
            origin_pin: origin_pin as string,
            destination_pin: destination_pin as string,
            weight: Number(weight),
            payment_mode: (payment_mode as 'Prepaid' | 'COD') || 'Prepaid',
            cod_amount: cod_amount ? Number(cod_amount) : undefined,
        });

        res.json({
            success: true,
            rate: result,
        });
    } catch (error: any) {
        console.error('Rate calculation error:', error.response?.data || error.message);
        const msg = error.response?.data?.message
            || error.response?.data?.error
            || (typeof error.response?.data === 'string' ? error.response.data : null)
            || error.message
            || 'Failed to calculate rate';
        res.status(error.response?.status || 500).json({
            success: false,
            error: msg,
        });
    }
});

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
router.post('/wallet/credit', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { merchantId, amount, description, reference } = req.body;

        if (!merchantId || !amount || amount <= 0) {
            throw new AppError(400, 'merchantId and a positive amount are required');
        }

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

// Get P&L analytics (shipped orders only; date filter on shippedAt)
router.get('/analytics/profit', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const [summary, byCourier, byVendor, orderCountByCourier] = await Promise.all([
            AnalyticsService.getProfitSummary(start, end),
            AnalyticsService.getProfitByCourier(start, end),
            AnalyticsService.getProfitByVendor(start, end),
            AnalyticsService.getOrderCountByCourier(start, end),
        ]);

        res.json({
            summary,
            byCourier,
            byVendor,
            orderCountByCourier,
        });
    } catch (error) {
        next(error);
    }
});

// Get admin orders list with profit and margin % per order (shipped orders only)
router.get('/orders', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { startDate, endDate, status, search, limit = '50', offset = '0' } = req.query;
        const where: Record<string, unknown> = {
            status: { in: ['READY_TO_SHIP', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
            awbNumber: { not: null },
        };
        if (status && typeof status === 'string' && status !== 'all') where.status = status;
        if (search && typeof search === 'string' && search.trim()) {
            const q = search.trim();
            where.OR = [
                { orderNumber: { contains: q, mode: 'insensitive' } },
                { customerName: { contains: q, mode: 'insensitive' } },
                { awbNumber: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (startDate || endDate) {
            const range: { gte?: Date; lte?: Date } = {};
            if (startDate) range.gte = new Date(startDate as string);
            if (endDate) range.lte = new Date(endDate as string);
            if (!where.OR) {
                where.OR = [
                    { shippedAt: { not: null, ...range } },
                    { shippedAt: null, updatedAt: range },
                ];
            }
        }
        const take = Math.min(parseInt(limit as string, 10) || 50, 200);
        const skip = parseInt(offset as string, 10) || 0;

        const orders = await prisma.order.findMany({
            where,
            take,
            skip,
            orderBy: { shippedAt: 'desc' },
            select: {
                id: true,
                orderNumber: true,
                customerName: true,
                customerPhone: true,
                courierName: true,
                awbNumber: true,
                status: true,
                paymentMode: true,
                productName: true,
                productValue: true,
                weight: true,
                vendorCharge: true,
                courierCost: true,
                margin: true,
                additionalChargeTotal: true,
                finalPrice: true,
                merchantId: true,
                shippedAt: true,
                createdAt: true,
                merchant: { select: { companyName: true, customerType: true } },
            },
        });

        const list = orders.map((o) => {
            const revenue = Number(o.vendorCharge) || 0;
            const cost = Number(o.courierCost) || 0;
            const profit = Number(o.margin) ?? (revenue - cost);
            const marginPercent = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;
            return {
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                customerPhone: o.customerPhone,
                vendorName: o.merchant?.companyName,
                courierName: AnalyticsService.normalizeCourierName(o.courierName),
                awbNumber: o.awbNumber,
                status: o.status,
                paymentMode: o.paymentMode,
                productName: o.productName,
                productValue: Number(o.productValue),
                weight: Number(o.weight),
                revenue,
                courierCost: cost,
                margin: Number(o.margin || 0),
                profit,
                marginPercent,
                additionalChargeTotal: Number(o.additionalChargeTotal || 0),
                finalPrice: Number(o.finalPrice || 0),
                vendorCharge: revenue,
                merchantId: o.merchantId,
                merchant: o.merchant,
                shippedAt: o.shippedAt,
                createdAt: o.createdAt,
            };
        });

        res.json({ orders: list });
    } catch (error) {
        next(error);
    }
});


// ============================================================
// PLATFORM SETTINGS
// ============================================================

router.get('/settings', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const settings = await CommissionService.getAllSettings();
        res.json(settings);
    } catch (error) {
        next(error);
    }
});

router.put('/settings', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { platform_commission_percent, platform_commission_number, min_recharge_amount, platform_qr_url, qc_charge } = req.body;

        if (platform_commission_percent !== undefined) {
            await CommissionService.updateCommissionPercent(Number(platform_commission_percent));
        }
        if (platform_commission_number !== undefined) {
            await CommissionService.setSetting('platform_commission_number', String(platform_commission_number));
        }
        if (min_recharge_amount !== undefined) {
            await CommissionService.updateMinRechargeAmount(Number(min_recharge_amount));
        }
        if (platform_qr_url !== undefined) {
            await CommissionService.updateQrUrl(String(platform_qr_url));
        }
        if (qc_charge !== undefined) {
            await CommissionService.updateQcCharge(Number(qc_charge));
        }

        const settings = await CommissionService.getAllSettings();
        res.json({ success: true, settings });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// VENDOR PAUSE / UNPAUSE
// ============================================================

router.put('/vendors/:id/pause', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { isPaused } = req.body;
        if (typeof isPaused !== 'boolean') {
            throw new AppError(400, 'isPaused (boolean) is required');
        }

        const merchant = await prisma.merchant.update({
            where: { id: req.params.id },
            data: { isPaused },
            select: { id: true, companyName: true, isPaused: true },
        });

        res.json({ success: true, merchant });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// PENDING QR PAYMENTS (ADMIN APPROVAL)
// ============================================================

router.get('/pending-payments', authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const pending = await prisma.walletTransaction.findMany({
            where: { type: 'QR_CREDIT', status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: {
                merchant: { select: { companyName: true, email: true } },
            },
        });
        res.json({ payments: pending });
    } catch (error) {
        next(error);
    }
});

router.post('/pending-payments/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const result = await WalletService.approvePendingTransaction(req.params.id);
        if (!result.success) {
            throw new AppError(400, result.error || 'Failed to approve payment');
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/pending-payments/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const result = await WalletService.rejectPendingTransaction(req.params.id);
        if (!result.success) {
            throw new AppError(400, result.error || 'Failed to reject payment');
        }
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// Wallet balance verification / reconciliation
router.get('/wallet/:merchantId/verify', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const result = await WalletService.verifyBalance(req.params.merchantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// ============================================================
// CUSTOMER TYPE MANAGEMENT
// ============================================================

router.put('/vendors/:id/customer-type', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { customerType, creditLimit } = req.body;
        if (!customerType || !['CASH', 'CREDIT'].includes(customerType)) {
            throw new AppError(400, 'customerType must be CASH or CREDIT');
        }

        const data: any = { customerType };

        if (customerType === 'CREDIT') {
            if (creditLimit === undefined || creditLimit === null || Number(creditLimit) < 0) {
                throw new AppError(400, 'creditLimit (>= 0) is required for CREDIT customers');
            }
            data.creditLimit = Number(creditLimit);
        } else {
            data.creditLimit = 0;
        }

        const merchant = await prisma.merchant.update({
            where: { id: req.params.id },
            data,
            select: { id: true, companyName: true, customerType: true, creditLimit: true },
        });

        res.json({ success: true, merchant });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// CUSTOMER PRICING CONFIGURATION
// ============================================================

router.get('/vendors/:id/pricing', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const merchant = await prisma.merchant.findUnique({
            where: { id: req.params.id },
            select: { id: true, companyName: true, marginType: true, marginValue: true },
        });
        if (!merchant) throw new AppError(404, 'Vendor not found');
        res.json({
            success: true,
            pricing: {
                marginType: merchant.marginType,
                marginValue: Number(merchant.marginValue),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.put('/vendors/:id/pricing', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { marginType, marginValue } = req.body;
        if (!marginType || !['percentage', 'fixed'].includes(marginType)) {
            throw new AppError(400, 'marginType must be "percentage" or "fixed"');
        }
        const numValue = Number(marginValue);
        if (isNaN(numValue) || numValue < 0) {
            throw new AppError(400, 'marginValue must be >= 0');
        }
        if (marginType === 'percentage' && numValue > 100) {
            throw new AppError(400, 'Percentage marginValue must be between 0 and 100');
        }

        const merchant = await prisma.merchant.update({
            where: { id: req.params.id },
            data: { marginType, marginValue: numValue },
            select: { id: true, companyName: true, marginType: true, marginValue: true },
        });

        res.json({
            success: true,
            pricing: {
                marginType: merchant.marginType,
                marginValue: Number(merchant.marginValue),
            },
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// MONTHLY INVOICE GENERATION
// ============================================================

router.post('/billing/generate-invoices', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { month } = req.body;
        const result = await BillingService.generateMonthlyInvoices(month || undefined);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// List all monthly invoices (admin view)
router.get('/billing/invoices', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { merchantId, isPaid } = req.query;
        const where: any = {};
        if (merchantId) where.merchantId = String(merchantId);
        if (isPaid !== undefined) where.isPaid = isPaid === 'true';

        const invoices = await prisma.monthlyInvoice.findMany({
            where,
            include: { merchant: { select: { companyName: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            invoices: invoices.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                merchantId: inv.merchantId,
                companyName: inv.merchant.companyName,
                month: inv.month,
                totalShipping: Number(inv.totalShipping),
                platformFee: Number(inv.platformFee),
                tax: Number(inv.tax),
                totalPayable: Number(inv.totalPayable),
                isPaid: inv.isPaid,
                paidAt: inv.paidAt,
                dueDate: inv.dueDate,
                pdfUrl: inv.pdfUrl,
                createdAt: inv.createdAt,
            })),
        });
    } catch (error) {
        next(error);
    }
});

// Mark invoice as paid manually (admin)
router.put('/billing/invoices/:id/mark-paid', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const invoice = await prisma.monthlyInvoice.update({
            where: { id: req.params.id },
            data: { isPaid: true, paidAt: new Date() },
        });
        res.json({ success: true, invoice });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// SHIPMENT ADDITIONAL CHARGES
// ============================================================

router.get('/orders/:id/additional-charges', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const charges = await prisma.shipmentAdditionalCharge.findMany({
            where: { orderId: req.params.id },
            orderBy: { createdAt: 'asc' },
        });
        res.json({
            success: true,
            charges: charges.map(c => ({
                id: c.id,
                chargeName: c.chargeName,
                chargeType: c.chargeType,
                chargeValue: Number(c.chargeValue),
                createdAt: c.createdAt,
            })),
        });
    } catch (error) {
        next(error);
    }
});

router.post('/orders/:id/additional-charges', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { chargeName, chargeType, chargeValue } = req.body;
        if (!chargeName || typeof chargeName !== 'string' || !chargeName.trim()) {
            throw new AppError(400, 'chargeName is required');
        }
        if (!chargeType || !['fixed', 'percentage'].includes(chargeType)) {
            throw new AppError(400, 'chargeType must be "fixed" or "percentage"');
        }
        const numValue = Number(chargeValue);
        if (isNaN(numValue) || numValue < 0) {
            throw new AppError(400, 'chargeValue must be >= 0');
        }
        if (chargeType === 'percentage' && numValue > 100) {
            throw new AppError(400, 'Percentage chargeValue must be between 0 and 100');
        }

        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            select: { id: true, courierCost: true, margin: true },
        });
        if (!order) throw new AppError(404, 'Order not found');

        const charge = await prisma.shipmentAdditionalCharge.create({
            data: {
                orderId: req.params.id,
                chargeName: chargeName.trim(),
                chargeType,
                chargeValue: numValue,
            },
        });

        const allCharges = await prisma.shipmentAdditionalCharge.findMany({
            where: { orderId: req.params.id },
        });
        const courierCost = Number(order.courierCost || 0);
        const marginAmount = Number(order.margin || 0);
        let additionalTotal = 0;
        for (const c of allCharges) {
            if (c.chargeType === 'percentage') {
                additionalTotal += courierCost * Number(c.chargeValue) / 100;
            } else {
                additionalTotal += Number(c.chargeValue);
            }
        }
        additionalTotal = Math.round(additionalTotal * 100) / 100;
        const finalPrice = Math.round((courierCost + marginAmount + additionalTotal) * 100) / 100;

        await prisma.order.update({
            where: { id: req.params.id },
            data: {
                additionalChargeTotal: additionalTotal,
                finalPrice,
                vendorCharge: finalPrice,
            },
        });

        res.json({
            success: true,
            charge: {
                id: charge.id,
                chargeName: charge.chargeName,
                chargeType: charge.chargeType,
                chargeValue: Number(charge.chargeValue),
            },
            additionalChargeTotal: additionalTotal,
            finalPrice,
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/orders/:id/additional-charges/:chargeId', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const existing = await prisma.shipmentAdditionalCharge.findFirst({
            where: { id: req.params.chargeId, orderId: req.params.id },
        });
        if (!existing) throw new AppError(404, 'Charge not found');

        await prisma.shipmentAdditionalCharge.delete({ where: { id: req.params.chargeId } });

        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            select: { courierCost: true, margin: true },
        });
        const courierCost = Number(order?.courierCost || 0);
        const marginAmount = Number(order?.margin || 0);

        const remainingCharges = await prisma.shipmentAdditionalCharge.findMany({
            where: { orderId: req.params.id },
        });
        let additionalTotal = 0;
        for (const c of remainingCharges) {
            if (c.chargeType === 'percentage') {
                additionalTotal += courierCost * Number(c.chargeValue) / 100;
            } else {
                additionalTotal += Number(c.chargeValue);
            }
        }
        additionalTotal = Math.round(additionalTotal * 100) / 100;
        const finalPrice = Math.round((courierCost + marginAmount + additionalTotal) * 100) / 100;

        await prisma.order.update({
            where: { id: req.params.id },
            data: {
                additionalChargeTotal: additionalTotal,
                finalPrice,
                vendorCharge: finalPrice,
            },
        });

        res.json({ success: true, additionalChargeTotal: additionalTotal, finalPrice });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// ORDER PRICE BREAKDOWN
// ============================================================

router.get('/orders/:id/price-breakdown', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            select: {
                courierCost: true,
                margin: true,
                vendorCharge: true,
                additionalChargeTotal: true,
                finalPrice: true,
                merchantId: true,
                merchant: { select: { customerType: true, companyName: true } },
            },
        });
        if (!order) throw new AppError(404, 'Order not found');

        const charges = await prisma.shipmentAdditionalCharge.findMany({
            where: { orderId: req.params.id },
            orderBy: { createdAt: 'asc' },
        });

        const courierCost = Number(order.courierCost || 0);
        const marginAmount = Number(order.margin || 0);
        const additionalChargeTotal = Number(order.additionalChargeTotal || 0);
        const finalPrice = Number(order.finalPrice || Number(order.vendorCharge || 0));

        res.json({
            success: true,
            breakdown: {
                courierCost,
                marginAmount,
                additionalCharges: charges.map(c => ({
                    id: c.id,
                    name: c.chargeName,
                    type: c.chargeType,
                    value: Number(c.chargeValue),
                })),
                additionalChargeTotal,
                finalPrice,
                customerType: order.merchant.customerType,
            },
        });
    } catch (error) {
        next(error);
    }
});

export const adminRouter = router;
