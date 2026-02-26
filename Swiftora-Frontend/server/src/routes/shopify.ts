import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { ShopifyService } from '../services/ShopifyService.js';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://swiftora.co';

// ============================================================
// GET /connect — Start OAuth flow
// ============================================================

router.get('/connect', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const shop = req.query.shop as string;
        if (!shop) throw new AppError(400, 'Shop domain is required (e.g. mystore.myshopify.com)');

        const merchantId = req.user!.merchantId;
        if (!merchantId) throw new AppError(400, 'Merchant account required');

        // Normalize shop domain
        const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

        const authUrl = ShopifyService.getAuthUrl(cleanShop, merchantId);
        res.json({ authUrl });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// GET /callback — OAuth callback from Shopify
// ============================================================

router.get('/callback', async (req, res, next) => {
    try {
        const { shop, code, state } = req.query;

        if (!shop || !code || !state) {
            return res.redirect(`${FRONTEND_URL}/dashboard/channel-integration?error=missing_params`);
        }

        const merchantId = ShopifyService.extractMerchantIdFromState(state as string);
        if (!merchantId) {
            return res.redirect(`${FRONTEND_URL}/dashboard/channel-integration?error=invalid_state`);
        }

        // Exchange code for access token
        const tokenData = await ShopifyService.exchangeCodeForToken(shop as string, code as string);

        // Store connection in DB
        await (prisma as any).shopifyConnection.upsert({
            where: {
                merchantId_shopDomain: {
                    merchantId,
                    shopDomain: shop as string,
                },
            },
            update: {
                accessToken: tokenData.access_token,
                scope: tokenData.scope,
                isActive: true,
                installedAt: new Date(),
            },
            create: {
                merchantId,
                shopDomain: shop as string,
                accessToken: tokenData.access_token,
                scope: tokenData.scope,
                isActive: true,
            },
        });

        // Register webhooks
        await ShopifyService.registerWebhooks(shop as string, tokenData.access_token);

        console.log(`[Shopify] OAuth complete for shop: ${shop}, merchant: ${merchantId}`);

        // Redirect back to dashboard
        res.redirect(`${FRONTEND_URL}/dashboard/channel-integration?shopify=connected`);
    } catch (error: any) {
        console.error('[Shopify] OAuth callback error:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/dashboard/channel-integration?error=oauth_failed`);
    }
});

// ============================================================
// GET /status — Connection status
// ============================================================

router.get('/status', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const merchantId = req.user!.merchantId;
        if (!merchantId) return res.json({ connected: false });

        const connection = await (prisma as any).shopifyConnection.findFirst({
            where: { merchantId, isActive: true },
            select: {
                id: true,
                shopDomain: true,
                isActive: true,
                autoFulfill: true,
                lastSyncAt: true,
                ordersSynced: true,
                installedAt: true,
                scope: true,
            },
        });

        if (!connection) {
            return res.json({ connected: false });
        }

        res.json({
            connected: true,
            shopDomain: connection.shopDomain,
            autoFulfill: connection.autoFulfill,
            lastSyncAt: connection.lastSyncAt,
            ordersSynced: connection.ordersSynced,
            installedAt: connection.installedAt,
            scope: connection.scope,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// POST /disconnect — Remove Shopify connection
// ============================================================

router.post('/disconnect', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const merchantId = req.user!.merchantId;
        if (!merchantId) throw new AppError(400, 'Merchant account required');

        const connection = await (prisma as any).shopifyConnection.findFirst({
            where: { merchantId, isActive: true },
        });

        if (!connection) throw new AppError(404, 'No active Shopify connection');

        // Remove webhooks
        try {
            await ShopifyService.removeWebhooks(connection.shopDomain, connection.accessToken);
        } catch (err) {
            console.warn('[Shopify] Failed to remove webhooks during disconnect:', err);
        }

        // Deactivate connection
        await (prisma as any).shopifyConnection.update({
            where: { id: connection.id },
            data: { isActive: false },
        });

        res.json({ success: true, message: 'Shopify disconnected successfully' });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// PUT /settings — Update auto-fulfill toggle
// ============================================================

router.put('/settings', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const merchantId = req.user!.merchantId;
        if (!merchantId) throw new AppError(400, 'Merchant account required');

        const { autoFulfill } = req.body;

        const connection = await (prisma as any).shopifyConnection.findFirst({
            where: { merchantId, isActive: true },
        });

        if (!connection) throw new AppError(404, 'No active Shopify connection');

        await (prisma as any).shopifyConnection.update({
            where: { id: connection.id },
            data: { autoFulfill: Boolean(autoFulfill) },
        });

        res.json({ success: true, autoFulfill: Boolean(autoFulfill) });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// POST /sync — Manual order sync
// ============================================================

router.post('/sync', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const merchantId = req.user!.merchantId;
        if (!merchantId) throw new AppError(400, 'Merchant account required');

        const connection = await (prisma as any).shopifyConnection.findFirst({
            where: { merchantId, isActive: true },
        });

        if (!connection) throw new AppError(404, 'No active Shopify connection');

        const result = await ShopifyService.syncOrders(
            connection.shopDomain,
            connection.accessToken,
            merchantId
        );

        res.json({
            success: true,
            synced: result.synced,
            skipped: result.skipped,
            message: `Synced ${result.synced} new orders (${result.skipped} already existed)`,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// POST /webhook — Receive Shopify webhooks (NO AUTH — uses HMAC)
// ============================================================

router.post('/webhook', async (req, res) => {
    try {
        const hmac = req.headers['x-shopify-hmac-sha256'] as string;
        const topic = req.headers['x-shopify-topic'] as string;
        const shop = req.headers['x-shopify-shop-domain'] as string;

        // Verify HMAC
        const rawBody = (req as any).rawBody;
        if (rawBody && hmac) {
            const isValid = ShopifyService.verifyWebhookHmac(rawBody, hmac);
            if (!isValid) {
                console.error('[Shopify Webhook] Invalid HMAC signature');
                return res.status(401).json({ error: 'Invalid HMAC' });
            }
        }

        console.log(`[Shopify Webhook] topic=${topic} shop=${shop}`);

        switch (topic) {
            case 'orders/create':
                await ShopifyService.processOrder(shop, req.body);
                break;

            case 'orders/updated':
                // Only process if order doesn't exist yet (avoid duplicate processing)
                await ShopifyService.processOrder(shop, req.body);
                break;

            case 'app/uninstalled':
                await ShopifyService.handleUninstall(shop);
                break;

            default:
                console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
        }

        // Always respond 200 to acknowledge
        res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('[Shopify Webhook] Error:', error.message);
        // Still return 200 to prevent Shopify retries for processing errors
        res.status(200).json({ received: true, error: error.message });
    }
});

export const shopifyRouter = router;
