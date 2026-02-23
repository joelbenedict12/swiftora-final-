/**
 * ANALYTICS SERVICE
 *
 * P&L and order analytics for admin dashboard.
 * All calculations server-side; filters by shipped orders and shippedAt date.
 */

import { prisma } from '../lib/prisma.js';

const SHIPPED_STATUSES = [
  'READY_TO_SHIP',
  'MANIFESTED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

const CANONICAL_COURIERS = ['DELHIVERY', 'XPRESSBEES', 'INNOFULFILL', 'EKART', 'BLITZ'] as const;

/**
 * Normalize courier name to canonical form for aggregation.
 */
export function normalizeCourierName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return 'UNKNOWN';
  const u = name.trim().toUpperCase();
  if (u === 'DELHIVERY') return 'DELHIVERY';
  if (u === 'XPRESSBEES') return 'XPRESSBEES';
  if (u === 'INNOFULFILL' || u === 'INNOFULLFILL') return 'INNOFULFILL';
  if (u === 'EKART') return 'EKART';
  if (u === 'BLITZ') return 'BLITZ';
  return u || 'UNKNOWN';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function orderProfit(o: { margin?: unknown; vendorCharge?: unknown; courierCost?: unknown }): number {
  const vc = Number(o.vendorCharge) || 0;
  const cc = Number(o.courierCost) || 0;
  const m = o.margin != null ? Number(o.margin) : NaN;
  if (!Number.isNaN(m)) return m;
  return vc - cc;
}

function buildShippedWhere(from?: Date, to?: Date) {
  const where: Record<string, unknown> = {
    status: { in: [...SHIPPED_STATUSES] },
  };
  if (from || to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = from;
    if (to) range.lte = to;
    where.shippedAt = range;
  } else {
    where.shippedAt = { not: null };
  }
  return where;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCourierCost: number;
  totalProfit: number;
  totalOrders: number;
  averageMarginPercent: number;
}

/**
 * Get P&L summary for shipped orders in date range.
 * Avg Margin % = 0 when totalRevenue is 0.
 */
export async function getProfitSummary(from?: Date, to?: Date): Promise<ProfitSummary> {
  const where = buildShippedWhere(from, to);
  const orders = await prisma.order.findMany({
    where,
    select: {
      courierCost: true,
      vendorCharge: true,
      margin: true,
    },
  });

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.vendorCharge) || 0), 0);
  const totalCourierCost = orders.reduce((s, o) => s + (Number(o.courierCost) || 0), 0);
  const totalProfit = orders.reduce((s, o) => s + orderProfit(o), 0);
  const averageMarginPercent = totalRevenue > 0 ? round2((totalProfit / totalRevenue) * 100) : 0;

  return {
    totalRevenue: round2(totalRevenue),
    totalCourierCost: round2(totalCourierCost),
    totalProfit: round2(totalProfit),
    totalOrders: orders.length,
    averageMarginPercent,
  };
}

export interface ProfitByCourierRow {
  courierName: string;
  totalRevenue: number;
  totalCourierCost: number;
  totalProfit: number;
  marginPercent: number;
  orderCount: number;
}

/**
 * Get profit breakdown by courier (normalized names). Excludes couriers with 0 orders.
 */
export async function getProfitByCourier(from?: Date, to?: Date): Promise<ProfitByCourierRow[]> {
  const where = buildShippedWhere(from, to);
  (where as any).courierName = { not: null };

  const orders = await prisma.order.findMany({
    where,
    select: {
      courierName: true,
      courierCost: true,
      vendorCharge: true,
      margin: true,
    },
  });

  const byCourier: Record<string, { totalRevenue: number; totalCourierCost: number; totalProfit: number; orderCount: number }> = {};

  orders.forEach((o) => {
    const name = normalizeCourierName(o.courierName);
    if (!byCourier[name]) {
      byCourier[name] = { totalRevenue: 0, totalCourierCost: 0, totalProfit: 0, orderCount: 0 };
    }
    byCourier[name].orderCount += 1;
    byCourier[name].totalRevenue += Number(o.vendorCharge) || 0;
    byCourier[name].totalCourierCost += Number(o.courierCost) || 0;
    byCourier[name].totalProfit += orderProfit(o);
  });

  return Object.entries(byCourier)
    .filter(([, v]) => v.orderCount > 0)
    .map(([courierName, v]) => ({
      courierName,
      totalRevenue: round2(v.totalRevenue),
      totalCourierCost: round2(v.totalCourierCost),
      totalProfit: round2(v.totalProfit),
      marginPercent: v.totalRevenue > 0 ? round2((v.totalProfit / v.totalRevenue) * 100) : 0,
      orderCount: v.orderCount,
    }));
}

export interface OrderCountByCourierRow {
  courierName: string;
  count: number;
  percent: number;
}

/**
 * Get order count by courier for pie chart. Normalized names; excludes zero count.
 */
export async function getOrderCountByCourier(from?: Date, to?: Date): Promise<OrderCountByCourierRow[]> {
  const where = buildShippedWhere(from, to);
  (where as any).courierName = { not: null };

  const orders = await prisma.order.findMany({
    where,
    select: { courierName: true },
  });

  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    const name = normalizeCourierName(o.courierName);
    counts[name] = (counts[name] || 0) + 1;
  });

  const total = orders.length;
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([courierName, count]) => ({
      courierName,
      count,
      percent: total > 0 ? round2((count / total) * 100) : 0,
    }));
}

export interface ProfitByVendorRow {
  merchantId: string;
  companyName: string;
  totalOrders: number;
  totalRevenue: number;
  totalCourierCost: number;
  totalProfit: number;
  marginPercent: number;
}

/**
 * Get profit breakdown by vendor (merchant).
 */
export async function getProfitByVendor(from?: Date, to?: Date): Promise<ProfitByVendorRow[]> {
  const where = buildShippedWhere(from, to);
  const orders = await prisma.order.findMany({
    where,
    select: {
      merchantId: true,
      courierCost: true,
      vendorCharge: true,
      margin: true,
      merchant: { select: { companyName: true } },
    },
  });

  const byVendor: Record<string, { companyName: string; totalRevenue: number; totalCourierCost: number; totalProfit: number; orderCount: number }> = {};

  orders.forEach((o) => {
    const id = o.merchantId;
    if (!byVendor[id]) {
      byVendor[id] = {
        companyName: o.merchant?.companyName ?? id,
        totalRevenue: 0,
        totalCourierCost: 0,
        totalProfit: 0,
        orderCount: 0,
      };
    }
    byVendor[id].orderCount += 1;
    byVendor[id].totalRevenue += Number(o.vendorCharge) || 0;
    byVendor[id].totalCourierCost += Number(o.courierCost) || 0;
    byVendor[id].totalProfit += orderProfit(o);
  });

  return Object.entries(byVendor).map(([merchantId, v]) => ({
    merchantId,
    companyName: v.companyName,
    totalOrders: v.orderCount,
    totalRevenue: round2(v.totalRevenue),
    totalCourierCost: round2(v.totalCourierCost),
    totalProfit: round2(v.totalProfit),
    marginPercent: v.totalRevenue > 0 ? round2((v.totalProfit / v.totalRevenue) * 100) : 0,
  }));
}
