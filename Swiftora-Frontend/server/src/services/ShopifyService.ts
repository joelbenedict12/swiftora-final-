import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || '';
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || '';
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_orders,write_orders,read_fulfillments,write_fulfillments';
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || 'https://swiftora-final.onrender.com/api/shopify/callback';
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';
const SHOPIFY_API_VERSION = '2024-01';

export class ShopifyService {

    // ── OAuth ──────────────────────────────────────────────────

    static getAuthUrl(shop: string, merchantId: string): string {
        const state = crypto.randomBytes(16).toString('hex') + ':' + merchantId;
        const scopes = SHOPIFY_SCOPES;
        const redirectUri = SHOPIFY_REDIRECT_URI;

        return `https://${shop}/admin/oauth/authorize?` +
            `client_id=${SHOPIFY_CLIENT_ID}` +
            `&scope=${scopes}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}`;
    }

    static extractMerchantIdFromState(state: string): string | null {
        const parts = state.split(':');
        return parts.length >= 2 ? parts.slice(1).join(':') : null;
    }

    static async exchangeCodeForToken(shop: string, code: string): Promise<{ access_token: string; scope: string }> {
        const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: SHOPIFY_CLIENT_ID,
            client_secret: SHOPIFY_CLIENT_SECRET,
            code,
        });
        return response.data;
    }

    // ── Webhooks ───────────────────────────────────────────────

    static async registerWebhooks(shop: string, accessToken: string): Promise<void> {
        const baseUrl = process.env.BACKEND_URL || 'https://swiftora-final.onrender.com';
        const webhookUrl = `${baseUrl}/api/shopify/webhook`;

        const topics = ['orders/create', 'orders/updated', 'app/uninstalled'];

        for (const topic of topics) {
            try {
                await axios.post(
                    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
                    {
                        webhook: {
                            topic,
                            address: webhookUrl,
                            format: 'json',
                        },
                    },
                    {
                        headers: {
                            'X-Shopify-Access-Token': accessToken,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log(`[Shopify] Registered webhook: ${topic} for ${shop}`);
            } catch (err: any) {
                // 422 = already registered, that's fine
                if (err.response?.status === 422) {
                    console.log(`[Shopify] Webhook ${topic} already registered for ${shop}`);
                } else {
                    console.error(`[Shopify] Failed to register webhook ${topic}:`, err.response?.data || err.message);
                }
            }
        }
    }

    static async removeWebhooks(shop: string, accessToken: string): Promise<void> {
        try {
            const response = await axios.get(
                `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
                { headers: { 'X-Shopify-Access-Token': accessToken } }
            );

            const webhooks = response.data?.webhooks || [];
            for (const webhook of webhooks) {
                try {
                    await axios.delete(
                        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks/${webhook.id}.json`,
                        { headers: { 'X-Shopify-Access-Token': accessToken } }
                    );
                } catch (err: any) {
                    console.warn(`[Shopify] Failed to delete webhook ${webhook.id}:`, err.message);
                }
            }
            console.log(`[Shopify] Removed ${webhooks.length} webhooks for ${shop}`);
        } catch (err: any) {
            console.error('[Shopify] Failed to list webhooks:', err.message);
        }
    }

    // ── HMAC Verification ──────────────────────────────────────

    static verifyWebhookHmac(rawBody: Buffer, hmacHeader: string): boolean {
        // Use webhook secret or fall back to client secret (Shopify signs with client secret)
        const secret = SHOPIFY_WEBHOOK_SECRET || SHOPIFY_CLIENT_SECRET;
        if (!secret) {
            console.error('[Shopify] No webhook secret or client secret configured for HMAC verification');
            return false;
        }
        const hash = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('base64');
        try {
            return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
        } catch {
            return false;
        }
    }

    // ── Order Processing ───────────────────────────────────────

    static async processOrder(shop: string, orderPayload: any): Promise<void> {
        const shopifyOrderId = String(orderPayload.id);

        // Find connection
        const connection = await (prisma as any).shopifyConnection.findFirst({
            where: { shopDomain: shop, isActive: true },
        });

        if (!connection) {
            console.warn(`[Shopify] No active connection for shop ${shop}`);
            return;
        }

        // Check duplicate
        const existing = await prisma.order.findFirst({
            where: { shopifyOrderId, merchantId: connection.merchantId } as any,
        });
        if (existing) {
            console.log(`[Shopify] Order ${shopifyOrderId} already exists, skipping`);
            return;
        }

        // Extract shipping address
        const shipping = orderPayload.shipping_address || orderPayload.billing_address || {};
        const lineItems = orderPayload.line_items || [];
        const productName = lineItems.map((i: any) => i.title || i.name).join(', ') || 'Shopify Order';
        const totalQuantity = lineItems.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
        const totalWeight = orderPayload.total_weight ? Number(orderPayload.total_weight) / 1000 : 0.5; // grams → kg

        const paymentMode = orderPayload.financial_status === 'paid' ? 'PREPAID' : 'COD';
        const codAmount = paymentMode === 'COD' ? Number(orderPayload.total_price) || 0 : 0;

        // Generate order number
        const orderCount = await prisma.order.count({ where: { merchantId: connection.merchantId } });
        const orderNumber = `SH-${Date.now()}-${orderCount + 1}`;

        // Find default warehouse
        const warehouse = await prisma.warehouse.findFirst({
            where: { merchantId: connection.merchantId, isActive: true } as any,
        });

        const order = await prisma.order.create({
            data: {
                orderNumber,
                merchantId: connection.merchantId,
                warehouseId: warehouse?.id || null,
                customerName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || 'Shopify Customer',
                customerPhone: shipping.phone || orderPayload.phone || '',
                customerEmail: orderPayload.email || null,
                shippingAddress: [shipping.address1, shipping.address2].filter(Boolean).join(', ') || '',
                shippingCity: shipping.city || '',
                shippingState: shipping.province || '',
                shippingPincode: shipping.zip || '',
                shippingLandmark: null,
                productName,
                productValue: Number(orderPayload.total_price) || 0,
                quantity: totalQuantity,
                paymentMode: paymentMode as any,
                codAmount: codAmount || null,
                weight: totalWeight,
                channel: 'SHOPIFY',
                shopifyOrderId,
                shopifyShop: shop,
                notes: `Shopify Order #${orderPayload.order_number || orderPayload.name}`,
                status: 'PENDING',
            } as any,
        });

        // Update sync counter
        await (prisma as any).shopifyConnection.update({
            where: { id: connection.id },
            data: {
                ordersSynced: { increment: 1 },
                lastSyncAt: new Date(),
            },
        });

        console.log(`[Shopify] Created order ${order.orderNumber} from Shopify order #${orderPayload.order_number}`);

        // Auto-fulfill if enabled
        if (connection.autoFulfill) {
            console.log(`[Shopify] Auto-fulfill enabled but requires manual courier selection — order left as PENDING`);
            // Auto-booking would require courier selection logic
            // For now, orders appear in the dashboard for manual shipping
        }
    }

    // ── Fulfillment Push ───────────────────────────────────────

    static async pushFulfillment(
        shop: string,
        accessToken: string,
        shopifyOrderId: string,
        trackingNumber: string,
        trackingCompany: string
    ): Promise<boolean> {
        try {
            // First, get the fulfillment order
            const fulfillmentOrdersRes = await axios.get(
                `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders/${shopifyOrderId}/fulfillment_orders.json`,
                { headers: { 'X-Shopify-Access-Token': accessToken } }
            );

            const fulfillmentOrders = fulfillmentOrdersRes.data?.fulfillment_orders || [];
            const openFulfillmentOrder = fulfillmentOrders.find(
                (fo: any) => fo.status === 'open' || fo.status === 'in_progress'
            );

            if (!openFulfillmentOrder) {
                console.log(`[Shopify] No open fulfillment order for ${shopifyOrderId}`);
                return false;
            }

            // Create fulfillment
            await axios.post(
                `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/fulfillments.json`,
                {
                    fulfillment: {
                        line_items_by_fulfillment_order: [{
                            fulfillment_order_id: openFulfillmentOrder.id,
                        }],
                        tracking_info: {
                            number: trackingNumber,
                            company: trackingCompany,
                        },
                        notify_customer: true,
                    },
                },
                {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log(`[Shopify] Pushed fulfillment for order ${shopifyOrderId}: ${trackingNumber}`);
            return true;
        } catch (err: any) {
            console.error(`[Shopify] Failed to push fulfillment:`, err.response?.data || err.message);
            return false;
        }
    }

    // ── Manual Sync ────────────────────────────────────────────

    static async syncOrders(shop: string, accessToken: string, merchantId: string): Promise<{ synced: number; skipped: number }> {
        let synced = 0;
        let skipped = 0;

        try {
            const response = await axios.get(
                `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=50`,
                { headers: { 'X-Shopify-Access-Token': accessToken } }
            );

            const orders = response.data?.orders || [];

            for (const order of orders) {
                const existing = await prisma.order.findFirst({
                    where: { shopifyOrderId: String(order.id), merchantId } as any,
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                try {
                    await ShopifyService.processOrder(shop, order);
                    synced++;
                } catch (err: any) {
                    console.error(`[Shopify] Failed to sync order ${order.id}:`, err.message);
                    skipped++;
                }
            }

            // Update last sync
            await (prisma as any).shopifyConnection.updateMany({
                where: { merchantId, shopDomain: shop },
                data: { lastSyncAt: new Date() },
            });
        } catch (err: any) {
            console.error('[Shopify] Sync failed:', err.response?.data || err.message);
        }

        return { synced, skipped };
    }

    // ── Handle App Uninstall ───────────────────────────────────

    static async handleUninstall(shop: string): Promise<void> {
        try {
            await (prisma as any).shopifyConnection.updateMany({
                where: { shopDomain: shop },
                data: { isActive: false },
            });
            console.log(`[Shopify] Marked connection inactive for uninstalled shop: ${shop}`);
        } catch (err: any) {
            console.error('[Shopify] Failed to handle uninstall:', err.message);
        }
    }
}
