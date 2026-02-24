import { prisma } from '../lib/prisma.js';
import { getCommissionPercent } from './commissionService.js';
import { generateInvoicePdf } from './invoicePdfService.js';

const GST_RATE = 0.18;

export interface InvoiceGenerationResult {
    merchantId: string;
    companyName: string;
    invoiceNumber: string;
    totalShipping: number;
    platformFee: number;
    tax: number;
    totalPayable: number;
    ledgerEntries: number;
}

/**
 * Generate monthly invoices for all CREDIT merchants.
 * @param monthStr e.g. "2026-02". Defaults to previous month.
 */
export async function generateMonthlyInvoices(monthStr?: string): Promise<{
    generated: InvoiceGenerationResult[];
    skipped: string[];
    errors: Array<{ merchantId: string; error: string }>;
}> {
    const now = new Date();
    let year: number;
    let month: number;

    if (monthStr) {
        const [y, m] = monthStr.split('-').map(Number);
        year = y;
        month = m;
    } else {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        year = prev.getFullYear();
        month = prev.getMonth() + 1;
    }

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const creditMerchants = await prisma.merchant.findMany({
        where: { customerType: 'CREDIT', isActive: true },
        select: { id: true, companyName: true },
    });

    const platformPercent = await getCommissionPercent();
    const generated: InvoiceGenerationResult[] = [];
    const skipped: string[] = [];
    const errors: Array<{ merchantId: string; error: string }> = [];

    for (const m of creditMerchants) {
        try {
            const existing = await prisma.monthlyInvoice.findFirst({
                where: { merchantId: m.id, month: monthKey },
            });
            if (existing) {
                skipped.push(m.id);
                continue;
            }

            const ledgerEntries = await prisma.creditLedger.findMany({
                where: {
                    merchantId: m.id,
                    createdAt: { gte: periodStart, lte: periodEnd },
                },
            });

            if (ledgerEntries.length === 0) {
                skipped.push(m.id);
                continue;
            }

            const totalShipping = ledgerEntries.reduce(
                (sum, e) => sum + Number(e.shippingCost), 0,
            );
            const platformFee = totalShipping * (platformPercent / 100);
            const tax = (totalShipping + platformFee) * GST_RATE;
            const totalPayable = totalShipping + platformFee + tax;

            const invoiceCount = await prisma.monthlyInvoice.count({ where: { merchantId: m.id } });
            const prefix = (m.companyName || 'SWF').substring(0, 3).toUpperCase();
            const invoiceNumber = `MINV-${prefix}-${monthKey.replace('-', '')}-${String(invoiceCount + 1).padStart(4, '0')}`;

            const dueDate = new Date(year, month, 15);

            const invoice = await prisma.monthlyInvoice.create({
                data: {
                    invoiceNumber,
                    merchantId: m.id,
                    month: monthKey,
                    totalShipping,
                    platformFee,
                    tax,
                    totalPayable,
                    dueDate,
                },
            });

            let pdfUrl: string | null = null;
            try {
                pdfUrl = await generateInvoicePdf({
                    invoiceId: invoice.id,
                    invoiceNumber,
                    companyName: m.companyName,
                    month: monthKey,
                    totalShipping,
                    platformFee,
                    platformPercent,
                    tax,
                    totalPayable,
                    dueDate,
                    ledgerEntries: ledgerEntries.length,
                });
                if (pdfUrl) {
                    await prisma.monthlyInvoice.update({
                        where: { id: invoice.id },
                        data: { pdfUrl },
                    });
                }
            } catch (pdfErr: any) {
                console.error(`[BILLING] PDF generation failed for ${m.companyName}:`, pdfErr.message);
            }

            // Clear ledger entries for the invoiced month
            await prisma.creditLedger.deleteMany({
                where: {
                    merchantId: m.id,
                    createdAt: { gte: periodStart, lte: periodEnd },
                },
            });

            generated.push({
                merchantId: m.id,
                companyName: m.companyName,
                invoiceNumber,
                totalShipping,
                platformFee,
                tax,
                totalPayable,
                ledgerEntries: ledgerEntries.length,
            });
        } catch (err: any) {
            errors.push({ merchantId: m.id, error: err.message });
        }
    }

    return { generated, skipped, errors };
}
