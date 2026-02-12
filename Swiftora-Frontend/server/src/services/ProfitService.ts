/**
 * PROFIT SERVICE
 * 
 * P&L analytics for admin dashboard.
 * Aggregates profit data from orders.
 */

import { prisma } from '../lib/prisma.js';

export interface ProfitSummary {
    totalProfit: number;
    totalCourierCost: number;
    totalVendorRevenue: number;
    totalOrders: number;
    averageMarginPercent: number;
}

export interface ProfitByCourier {
    courierName: string;
    totalOrders: number;
    totalCourierCost: number;
    totalVendorRevenue: number;
    totalProfit: number;
    marginPercent: number;
}

export interface ProfitByVendor {
    merchantId: string;
    companyName: string;
    totalOrders: number;
    totalCourierCost: number;
    totalVendorRevenue: number;
    totalProfit: number;
}

/**
 * Get total profit by date range.
 */
export async function getTotalProfitByDateRange(
    startDate?: Date,
    endDate?: Date
): Promise<ProfitSummary> {
    const where: any = {
        status: { in: ['READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await prisma.order.findMany({
        where,
        select: {
            courierCost: true,
            vendorCharge: true,
            margin: true,
            productValue: true,
        },
    });

    const totalCourierCost = orders.reduce((sum, o) => sum + (Number(o.courierCost) || 0), 0);
    const totalVendorRevenue = orders.reduce((sum, o) => sum + (Number(o.vendorCharge) || Number(o.productValue) || 0), 0);
    const totalProfit = orders.reduce((sum, o) => sum + (Number(o.margin) || 0), 0);
    const averageMarginPercent = totalVendorRevenue > 0
        ? Math.round((totalProfit / totalVendorRevenue) * 10000) / 100
        : 0;

    return {
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalCourierCost: Math.round(totalCourierCost * 100) / 100,
        totalVendorRevenue: Math.round(totalVendorRevenue * 100) / 100,
        totalOrders: orders.length,
        averageMarginPercent,
    };
}

/**
 * Get profit breakdown by courier.
 */
export async function getProfitByCourier(
    startDate?: Date,
    endDate?: Date
): Promise<ProfitByCourier[]> {
    const where: any = {
        courierName: { not: null },
        status: { in: ['READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await prisma.order.findMany({
        where,
        select: {
            courierName: true,
            courierCost: true,
            vendorCharge: true,
            margin: true,
            productValue: true,
        },
    });

    // Group by courier
    const byCourier: Record<string, ProfitByCourier> = {};

    orders.forEach(order => {
        const name = order.courierName || 'UNKNOWN';
        if (!byCourier[name]) {
            byCourier[name] = {
                courierName: name,
                totalOrders: 0,
                totalCourierCost: 0,
                totalVendorRevenue: 0,
                totalProfit: 0,
                marginPercent: 0,
            };
        }
        byCourier[name].totalOrders++;
        byCourier[name].totalCourierCost += Number(order.courierCost) || 0;
        byCourier[name].totalVendorRevenue += Number(order.vendorCharge) || Number(order.productValue) || 0;
        byCourier[name].totalProfit += Number(order.margin) || 0;
    });

    // Calculate margin percent
    return Object.values(byCourier).map(c => ({
        ...c,
        totalCourierCost: Math.round(c.totalCourierCost * 100) / 100,
        totalVendorRevenue: Math.round(c.totalVendorRevenue * 100) / 100,
        totalProfit: Math.round(c.totalProfit * 100) / 100,
        marginPercent: c.totalVendorRevenue > 0
            ? Math.round((c.totalProfit / c.totalVendorRevenue) * 10000) / 100
            : 0,
    }));
}

/**
 * Get profit breakdown by vendor (merchant).
 */
export async function getProfitByVendor(
    startDate?: Date,
    endDate?: Date
): Promise<ProfitByVendor[]> {
    const where: any = {
        status: { in: ['READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await prisma.order.findMany({
        where,
        select: {
            merchantId: true,
            courierCost: true,
            vendorCharge: true,
            margin: true,
            productValue: true,
            merchant: {
                select: { companyName: true },
            },
        },
    });

    // Group by vendor
    const byVendor: Record<string, ProfitByVendor> = {};

    orders.forEach(order => {
        const id = order.merchantId;
        if (!byVendor[id]) {
            byVendor[id] = {
                merchantId: id,
                companyName: order.merchant.companyName,
                totalOrders: 0,
                totalCourierCost: 0,
                totalVendorRevenue: 0,
                totalProfit: 0,
            };
        }
        byVendor[id].totalOrders++;
        byVendor[id].totalCourierCost += Number(order.courierCost) || 0;
        byVendor[id].totalVendorRevenue += Number(order.vendorCharge) || Number(order.productValue) || 0;
        byVendor[id].totalProfit += Number(order.margin) || 0;
    });

    return Object.values(byVendor).map(v => ({
        ...v,
        totalCourierCost: Math.round(v.totalCourierCost * 100) / 100,
        totalVendorRevenue: Math.round(v.totalVendorRevenue * 100) / 100,
        totalProfit: Math.round(v.totalProfit * 100) / 100,
    }));
}
