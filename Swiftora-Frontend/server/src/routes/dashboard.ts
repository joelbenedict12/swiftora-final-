import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Dashboard overview
router.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const merchantId = req.user?.merchantId;

    // If no merchantId, return empty stats
    if (!merchantId) {
      return res.json({
        stats: {
          totalOrders: 0,
          todayOrders: 0,
          activeOrders: 0,
          outForPickupOrders: 0,
          deliveredOrders: 0,
          rtoOrders: 0,
          totalPickups: 0,
          pendingPickups: 0,
          walletBalance: 0,
          creditLimit: 0,
        },
        recentOrders: [],
        upcomingPickups: [],
        totalOrders: 0,
        todayOrders: 0,
        activeOrders: 0,
        outForPickupOrders: 0,
        deliveredOrders: 0,
        rtoOrders: 0,
        totalPickups: 0,
        pendingPickups: 0,
      });
    }

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get stats
    const [
      totalOrders,
      todayOrders,
      activeOrders,
      outForPickupOrders,
      deliveredOrders,
      rtoOrders,
      totalPickups,
      pendingPickups,
      merchant,
    ] = await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.count({
        where: {
          merchantId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.order.count({
        where: {
          merchantId,
          status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        },
      }),
      prisma.order.count({
        where: {
          merchantId,
          status: 'OUT_FOR_PICKUP',
        },
      }),
      prisma.order.count({
        where: {
          merchantId,
          status: 'DELIVERED',
        },
      }),
      prisma.order.count({
        where: {
          merchantId,
          status: { in: ['RTO', 'RTO_DELIVERED'] },
        },
      }),
      // Total Pickups: orders ready at warehouse (scheduled for courier pickup)
      prisma.order.count({
        where: {
          merchantId,
          status: 'READY_TO_SHIP',
        },
      }),
      // Pending Pickups: orders awaiting pickup (courier out for pickup)
      prisma.order.count({
        where: {
          merchantId,
          status: 'OUT_FOR_PICKUP',
        },
      }),
      prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { walletBalance: true, creditLimit: true },
      }),
    ]);

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        warehouse: {
          select: { name: true },
        },
      },
    });

    // Upcoming pickups
    const upcomingPickups = await prisma.pickup.findMany({
      where: {
        merchantId,
        status: 'SCHEDULED',
        scheduledDate: { gte: today },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
      include: {
        warehouse: {
          select: { name: true, address: true },
        },
      },
    });

    res.json({
      stats: {
        totalOrders,
        todayOrders,
        activeOrders,
        outForPickupOrders,
        deliveredOrders,
        rtoOrders,
        totalPickups,
        pendingPickups,
        walletBalance: merchant?.walletBalance || 0,
        creditLimit: merchant?.creditLimit || 0,
      },
      totalOrders,
      todayOrders,
      activeOrders,
      outForPickupOrders,
      deliveredOrders,
      rtoOrders,
      totalPickups,
      pendingPickups,
      recentOrders,
      upcomingPickups,
    });
  } catch (error) {
    next(error);
  }
});

// Analytics data
router.get('/analytics', async (req: AuthRequest, res, next) => {
  try {
    const merchantId = req.user?.merchantId;
    const { period = '7d' } = req.query;

    // If no merchantId, return empty analytics
    if (!merchantId) {
      return res.json({
        ordersByDate: {},
        deliveredByDate: {},
        revenueByDate: {},
        statusCounts: {},
        orderTrends: [],
        total: 0,
      });
    }

    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Orders by date
    const orders = await prisma.order.findMany({
      where: {
        merchantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
        paymentMode: true,
        codAmount: true,
      },
    });

    // Group by date
    const ordersByDate: Record<string, number> = {};
    const deliveredByDate: Record<string, number> = {};
    const revenueByDate: Record<string, number> = {};
    const inTransitByDate: Record<string, number> = {};
    const rtoByDate: Record<string, number> = {};

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      ordersByDate[date] = (ordersByDate[date] || 0) + 1;

      if (order.status === 'DELIVERED') {
        deliveredByDate[date] = (deliveredByDate[date] || 0) + 1;
        revenueByDate[date] = (revenueByDate[date] || 0) + (Number(order.codAmount) || 0);
      }

      if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.status)) {
        inTransitByDate[date] = (inTransitByDate[date] || 0) + 1;
      }

      if (['RTO', 'RTO_DELIVERED'].includes(order.status)) {
        rtoByDate[date] = (rtoByDate[date] || 0) + 1;
      }
    });

    // Status distribution
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    // Create orderTrends array for the frontend chart
    const dates = Object.keys(ordersByDate).sort();
    const orderTrends = dates.map(date => ({
      date,
      totalOrders: ordersByDate[date] || 0,
      delivered: deliveredByDate[date] || 0,
      inTransit: inTransitByDate[date] || 0,
      rto: rtoByDate[date] || 0,
      revenue: revenueByDate[date] || 0,
    }));

    res.json({
      ordersByDate,
      deliveredByDate,
      revenueByDate,
      statusCounts,
      orderTrends,
      total: orders.length,
    });
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
