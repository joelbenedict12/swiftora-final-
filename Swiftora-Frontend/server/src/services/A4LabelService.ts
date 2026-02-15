/**
 * A4 Professional Shipping Label Service
 * Generates unified A4 PDF labels for all couriers (Delhivery, Blitz, Ekart, Xpressbees, Innofulfill).
 * Uses Code128 barcodes (bwip-js) and Puppeteer (puppeteer-core + @sparticuz/chromium) for HTML → PDF.
 * @sparticuz/chromium provides a bundled Chromium so PDF generation works on serverless/Render without system Chrome.
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import bwipjs from 'bwip-js';

// Disable WebGL so serverless Chromium works without GPU (recommended for Render/Lambda).
chromium.setGraphicsMode = false;

const BASE_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'https://swiftora.co';

export interface A4LabelData {
  awb: string;
  internalCode: string;
  courierLogo: string;
  destinationPincode: string;
  routingCode: string;
  consigneeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  paymentMode: string;
  serviceType: string;
  amount: string | number;
  sellerName: string;
  sellerAddress: string;
  gst: string;
  date: string;
  product: string;
  returnAddress: string;
}

export class A4LabelService {
  static async generateBarcode(text: string): Promise<string> {
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
    });
    return buffer.toString('base64');
  }

  static generateHTML(data: A4LabelData, barcode1: string, barcode2: string): string {
    const amount = typeof data.amount === 'number' ? data.amount : data.amount;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 16px; font-size: 12px; color: #000; }
    .box { border: 2px solid #000; padding: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .header img { max-height: 48px; object-fit: contain; }
    .barcode-block { text-align: center; margin: 12px 0; }
    .barcode-block img { max-width: 60%; height: auto; }
    .pincode-row { display: flex; justify-content: space-between; font-weight: bold; margin: 8px 0; }
    hr { border: none; border-top: 1px solid #000; margin: 10px 0; }
    .two-col { display: flex; }
    .two-col .left { width: 70%; padding-right: 12px; }
    .two-col .right { width: 30%; border-left: 1px solid #000; padding-left: 12px; }
    .seller-row { display: flex; margin: 10px 0; }
    .seller-row .left { width: 70%; }
    .seller-row .right { width: 30%; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px; }
    th { font-weight: bold; background: #f0f0f0; }
    .return { margin-top: 12px; padding-top: 8px; border-top: 1px solid #000; font-size: 11px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <img src="${BASE_URL}/new-logo.jpg" alt="Swiftora" height="50" />
      <img src="${data.courierLogo}" alt="Courier" height="40" />
    </div>

    <div class="barcode-block">
      <img src="data:image/png;base64,${barcode1}" alt="AWB" />
    </div>
    <p style="text-align:center; margin:4px 0; font-weight:bold;">${data.awb}</p>

    <div class="pincode-row">
      <span>${data.destinationPincode}</span>
      <span>${data.routingCode}</span>
    </div>

    <hr/>

    <div class="two-col">
      <div class="left">
        <strong>Ship To:</strong><br/>
        <b>${escapeHtml(data.consigneeName)}</b><br/>
        ${escapeHtml(data.address)}<br/>
        ${escapeHtml(data.city)}, ${escapeHtml(data.state)}<br/>
        PIN: ${escapeHtml(data.pincode)}<br/>
        Phone: ${escapeHtml(data.phone)}
      </div>
      <div class="right">
        <b>${escapeHtml(data.paymentMode)}</b><br/>
        ${escapeHtml(data.serviceType)}<br/><br/>
        INR ${amount}
      </div>
    </div>

    <hr/>

    <div class="seller-row">
      <div class="left">
        <strong>Seller:</strong> ${escapeHtml(data.sellerName)}<br/>
        Address: ${escapeHtml(data.sellerAddress)}<br/>
        GST: ${escapeHtml(data.gst)}
      </div>
      <div class="right">
        Date: ${escapeHtml(data.date)}
      </div>
    </div>

    <table>
      <tr><th>Product (Qty)</th><th>Price</th><th>Total</th></tr>
      <tr>
        <td>${escapeHtml(data.product)}</td>
        <td>INR ${amount}</td>
        <td>INR ${amount}</td>
      </tr>
    </table>

    <div class="barcode-block">
      <img src="data:image/png;base64,${barcode2}" alt="Internal" />
    </div>
    <p style="text-align:center; margin:4px 0; font-size:10px;">${escapeHtml(data.internalCode)}</p>

    <div class="return">
      <strong>Return Address:</strong> ${escapeHtml(data.returnAddress)}
    </div>
  </div>
</body>
</html>`;
  }

  static async generateA4ShippingLabel(orderData: A4LabelData): Promise<Buffer> {
    const barcode1 = await this.generateBarcode(orderData.awb);
    const barcode2 = await this.generateBarcode(orderData.internalCode);
    const html = this.generateHTML(orderData, barcode1, barcode2);

    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 794, height: 1123 }, // A4 @ 96dpi
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(s).replace(/[&<>"']/g, (c) => map[c] ?? c);
}
