import { prisma } from '../lib/prisma.js';

export interface OutstandingResult {
    unpaidInvoiceTotal: number;
    currentMonthLedgerTotal: number;
    totalOutstanding: number;
    creditLimit: number;
    availableCredit: number;
}

export async function calculateOutstanding(merchantId: string): Promise<OutstandingResult> {
    const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { creditLimit: true },
    });

    const creditLimit = Number(merchant?.creditLimit ?? 0);

    const unpaidInvoiceAgg = await prisma.monthlyInvoice.aggregate({
        where: { merchantId, isPaid: false },
        _sum: { totalPayable: true },
    });
    const unpaidInvoiceTotal = Number(unpaidInvoiceAgg._sum.totalPayable ?? 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const ledgerAgg = await prisma.creditLedger.aggregate({
        where: {
            merchantId,
            createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { shippingCost: true },
    });
    const currentMonthLedgerTotal = Number(ledgerAgg._sum.shippingCost ?? 0);

    const totalOutstanding = unpaidInvoiceTotal + currentMonthLedgerTotal;
    const availableCredit = Math.max(0, creditLimit - totalOutstanding);

    return {
        unpaidInvoiceTotal,
        currentMonthLedgerTotal,
        totalOutstanding,
        creditLimit,
        availableCredit,
    };
}

export async function hasUnpaidInvoice(merchantId: string): Promise<boolean> {
    const count = await prisma.monthlyInvoice.count({
        where: { merchantId, isPaid: false },
    });
    return count > 0;
}

export async function recordCreditShipment(
    merchantId: string,
    orderId: string,
    shippingCost: number,
) {
    return prisma.creditLedger.create({
        data: { merchantId, orderId, shippingCost },
    });
}

export async function removeCreditShipment(merchantId: string, orderId: string) {
    return prisma.creditLedger.deleteMany({
        where: { merchantId, orderId },
    });
}
