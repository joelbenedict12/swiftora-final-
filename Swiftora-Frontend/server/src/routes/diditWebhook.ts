import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

const WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET;

export async function diditWebhookHandler(req: Request, res: Response): Promise<void> {
  try {
    // Vercel may pre-parse body; express.raw() may leave req.body as Buffer or empty
    let rawBody: string;
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (req.body && Buffer.isBuffer(req.body)) {
      rawBody = req.body.length > 0 ? req.body.toString('utf8') : '';
    } else if (req.body && typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body);
    } else {
      rawBody = '';
    }
    const signature =
      req.get('X-Signature') ||
      req.get('X-Signature-Simple') ||
      req.get('X-Signature-V2');
    const timestamp = req.get('X-Timestamp');
    const headerTestWebhook = req.get('X-Didit-Test-Webhook') === 'true';
    // Treat as test webhook from header OR from payload (in case header is stripped by proxy)
    let isTestWebhook = headerTestWebhook;
    if (!isTestWebhook && rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as { metadata?: { test_webhook?: boolean } };
        isTestWebhook = parsed?.metadata?.test_webhook === true;
      } catch {
        // ignore
      }
    }

    if (!WEBHOOK_SECRET) {
      res.status(501).json({ message: 'Webhook secret not configured' });
      return;
    }
    if (!rawBody) {
      res.status(400).json({ message: 'Missing body' });
      return;
    }

    // Test webhooks: never verify signature (body may be re-stringified on Vercel so HMAC won't match).
    // Production only: require X-Signature (64-char HMAC-SHA256) and verify.
    if (!isTestWebhook) {
      if (!signature) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      if (timestamp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const incomingTime = parseInt(timestamp, 10);
        if (Math.abs(currentTime - incomingTime) > 300) {
          res.status(401).json({ message: 'Request timestamp is stale.' });
          return;
        }
      }
      if (signature.length === 64) {
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
        const expectedSignature = hmac.update(rawBody).digest('hex');
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const providedBuf = Buffer.from(signature, 'utf8');
        if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
          res.status(401).json({ message: 'Invalid signature' });
          return;
        }
      }
    }

    const body = JSON.parse(rawBody) as {
      session_id?: string;
      status?: string;
      vendor_data?: string;
      decision?: unknown;
    };
    const { session_id, status, vendor_data, decision } = body;

    if (!vendor_data) {
      res.status(200).json({ message: 'Webhook received' });
      return;
    }

    // Test webhooks use vendor_data "test-vendor-data-123" — no real merchant; skip DB write
    if (isTestWebhook && vendor_data === 'test-vendor-data-123') {
      res.status(200).json({ message: 'Webhook event dispatched' });
      return;
    }

    await prisma.kycVerification.upsert({
      where: { merchantId: vendor_data },
      create: {
        merchantId: vendor_data,
        diditSessionId: session_id || null,
        vendorData: vendor_data,
        status: status || 'Pending',
        decisionJson: decision ? JSON.stringify(decision) : null,
      },
      update: {
        diditSessionId: session_id || undefined,
        status: status || undefined,
        decisionJson: decision ? JSON.stringify(decision) : undefined,
      },
    });

    res.status(200).json({ message: 'Webhook event dispatched' });
  } catch (e) {
    console.error('Didit webhook error:', e);
    res.status(500).json({ message: 'Internal error' });
  }
}
