import fs from 'fs';
import path from 'path';

export interface InvoicePdfData {
    invoiceId: string;
    invoiceNumber: string;
    companyName: string;
    month: string;
    totalShipping: number;
    platformFee: number;
    platformPercent: number;
    tax: number;
    totalPayable: number;
    dueDate: Date;
    ledgerEntries: number;
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function buildHtml(data: InvoicePdfData): string {
    const dueDateStr = data.dueDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
    const monthLabel = (() => {
        const [y, m] = data.month.split('-');
        const d = new Date(Number(y), Number(m) - 1);
        return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    })();

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 700; color: #2563eb; }
  .logo-sub { font-size: 12px; color: #666; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { margin: 0; font-size: 32px; color: #1a1a1a; }
  .invoice-title .num { font-size: 14px; color: #666; margin-top: 4px; }
  .meta-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .meta-box { background: #f8fafc; border-radius: 8px; padding: 16px 20px; flex: 1; margin-right: 16px; }
  .meta-box:last-child { margin-right: 0; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
  .meta-value { font-size: 16px; font-weight: 600; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #2563eb; color: white; text-align: left; padding: 12px 16px; font-size: 13px; }
  td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  .total-row td { font-weight: 700; font-size: 16px; background: #eff6ff; border-top: 2px solid #2563eb; }
  .footer { margin-top: 40px; text-align: center; color: #888; font-size: 11px; }
  .due-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 20px; text-align: center; margin-bottom: 20px; }
  .due-box strong { color: #92400e; }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">Swiftora</div>
    <div class="logo-sub">Smart Logistics & Shipping</div>
  </div>
  <div class="invoice-title">
    <h1>INVOICE</h1>
    <div class="num">${data.invoiceNumber}</div>
  </div>
</div>

<div class="meta-row">
  <div class="meta-box">
    <div class="meta-label">Billed To</div>
    <div class="meta-value">${data.companyName}</div>
  </div>
  <div class="meta-box">
    <div class="meta-label">Billing Period</div>
    <div class="meta-value">${monthLabel}</div>
  </div>
  <div class="meta-box">
    <div class="meta-label">Total Shipments</div>
    <div class="meta-value">${data.ledgerEntries}</div>
  </div>
</div>

<div class="due-box">
  Payment Due By: <strong>${dueDateStr}</strong>
</div>

<table>
  <thead>
    <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
  </thead>
  <tbody>
    <tr><td>Shipping Charges (${data.ledgerEntries} shipments)</td><td style="text-align:right">${fmt(data.totalShipping)}</td></tr>
    <tr><td>Platform Fee (${data.platformPercent}%)</td><td style="text-align:right">${fmt(data.platformFee)}</td></tr>
    <tr><td>GST (18%)</td><td style="text-align:right">${fmt(data.tax)}</td></tr>
    <tr class="total-row"><td>Total Payable</td><td style="text-align:right">${fmt(data.totalPayable)}</td></tr>
  </tbody>
</table>

<div class="footer">
  <p>This is a computer-generated invoice. No signature required.</p>
  <p>Swiftora Logistics Pvt. Ltd. &bull; support@swiftora.co</p>
</div>
</body></html>`;
}

/**
 * Generate a PDF invoice. Uses puppeteer-core if available, otherwise
 * saves the HTML directly as a fallback.
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<string | null> {
    const html = buildHtml(data);
    const dir = path.resolve('public', 'invoices');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        const puppeteer = await import('puppeteer-core');
        let chromiumPath: string | undefined;

        try {
            const chromium = await import('@sparticuz/chromium');
            chromiumPath = await chromium.default.executablePath();
        } catch {
            const possiblePaths = [
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                process.env.CHROME_PATH,
            ];
            chromiumPath = possiblePaths.find(p => p && fs.existsSync(p));
        }

        if (!chromiumPath) {
            console.warn('[PDF] No Chrome/Chromium found; saving HTML fallback');
            const htmlPath = path.join(dir, `${data.invoiceId}.html`);
            fs.writeFileSync(htmlPath, html);
            return `/invoices/${data.invoiceId}.html`;
        }

        const browser = await puppeteer.default.launch({
            executablePath: chromiumPath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfPath = path.join(dir, `${data.invoiceId}.pdf`);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        });

        await browser.close();
        return `/invoices/${data.invoiceId}.pdf`;
    } catch (err: any) {
        console.error('[PDF] Puppeteer failed, saving HTML fallback:', err.message);
        const htmlPath = path.join(dir, `${data.invoiceId}.html`);
        fs.writeFileSync(htmlPath, html);
        return `/invoices/${data.invoiceId}.html`;
    }
}
