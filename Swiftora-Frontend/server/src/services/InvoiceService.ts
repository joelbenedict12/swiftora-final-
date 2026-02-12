/**
 * INVOICE SERVICE
 * 
 * Generates monthly invoices for vendors.
 * Aggregates orders, courier costs, vendor charges, and profit.
 */

import { prisma } from '../lib/prisma.js';

/**
 * Generate monthly invoice for a vendor.
 */
export async function generateMonthlyInvoice(merchantId: string, month: number, year: number) {
    // Period boundaries
    const periodStart = new Date(year, month - 1, 1); // Month is 0-indexed
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    // Check if invoice already exists for this period
    const existing = await prisma.invoice.findFirst({
        where: {
            merchantId,
            periodStart: { gte: periodStart },
            periodEnd: { lte: new Date(year, month, 1) },
        },
    });

    if (existing) {
        return { success: false, error: 'Invoice already exists for this period', invoice: existing };
    }

    // Aggregate orders for the period
    const orders = await prisma.order.findMany({
        where: {
            merchantId,
            createdAt: { gte: periodStart, lte: periodEnd },
            status: { notIn: ['CANCELLED'] },
        },
        select: {
            courierCost: true,
            vendorCharge: true,
            margin: true,
            productValue: true,
        },
    });

    const totalShipments = orders.length;
    const totalCourierCost = orders.reduce((sum, o) => sum + (Number(o.courierCost) || 0), 0);
    const totalVendorCharge = orders.reduce((sum, o) => sum + (Number(o.vendorCharge) || 0), 0);
    const totalProfit = orders.reduce((sum, o) => sum + (Number(o.margin) || 0), 0);

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({ where: { merchantId } });
    const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { companyName: true },
    });
    const prefix = (merchant?.companyName || 'SWF').substring(0, 3).toUpperCase();
    const invoiceNumber = `INV-${prefix}-${year}${String(month).padStart(2, '0')}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculate tax (18% GST)
    const taxRate = 0.18;
    const amount = totalVendorCharge;
    const tax = Math.round(amount * taxRate * 100) / 100;
    const totalAmount = Math.round((amount + tax) * 100) / 100;

    // Due date: 15 days from generation
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = await prisma.invoice.create({
        data: {
            invoiceNumber,
            merchantId,
            amount,
            tax,
            totalAmount,
            totalShipments,
            totalCourierCost,
            totalVendorCharge,
            totalProfit,
            periodStart,
            periodEnd,
            dueDate,
            status: 'PENDING',
        },
    });

    return { success: true, invoice };
}

/**
 * List invoices with optional filters.
 */
export async function listInvoices(filters?: {
    merchantId?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.merchantId) where.merchantId = filters.merchantId;
    if (filters?.status) where.status = filters.status;

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                merchant: {
                    select: { companyName: true, email: true },
                },
            },
        }),
        prisma.invoice.count({ where }),
    ]);

    return {
        invoices,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Update invoice status (e.g., mark as paid).
 */
export async function updateInvoiceStatus(invoiceId: string, status: string) {
    const data: any = { status };
    if (status === 'PAID') {
        data.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data,
    });

    return invoice;
}
