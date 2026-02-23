import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import * as WalletService from '../services/WalletService.js';
import * as CashfreeService from '../services/cashfreeService.js';

const router = Router();

/**
 * Cashfree webhook handler.
 * No auth middleware -- Cashfree sends this directly.
 * Verified via webhook signature.
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const timestamp = req.headers['x-cashfree-timestamp'] as string || '';
        const signature = req.headers['x-cashfree-signature'] as string || '';
        const rawBody = JSON.stringify(req.body);

        const isValid = CashfreeService.verifyWebhookSignature(rawBody, timestamp, signature);
        if (!isValid) {
            console.warn('Cashfree webhook: invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const { data, type } = req.body;

        if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'ORDER_PAID_WEBHOOK') {
            const orderId = data?.order?.order_id;
            const orderAmount = data?.order?.order_amount;

            if (!orderId) {
                console.warn('Cashfree webhook: missing order_id');
                return res.status(200).json({ ok: true });
            }

            const paymentOrder = await prisma.paymentOrder.findUnique({
                where: { cfOrderId: orderId },
            });

            if (!paymentOrder) {
                console.warn(`Cashfree webhook: PaymentOrder not found for ${orderId}`);
                return res.status(200).json({ ok: true });
            }

            if (paymentOrder.status === 'PAID') {
                return res.status(200).json({ ok: true, message: 'Already processed' });
            }

            await prisma.paymentOrder.update({
                where: { id: paymentOrder.id },
                data: {
                    status: 'PAID',
                    cfPaymentId: data?.payment?.cf_payment_id?.toString() || paymentOrder.cfPaymentId,
                },
            });

            const creditResult = await WalletService.credit(
                paymentOrder.merchantId,
                Number(paymentOrder.amount),
                `Wallet recharge via Cashfree - ${orderId}`,
                orderId,
            );

            if (creditResult.success) {
                console.log(`Cashfree webhook: credited ₹${orderAmount} to merchant ${paymentOrder.merchantId}`);
            } else {
                console.error(`Cashfree webhook: credit failed for ${orderId}:`, creditResult.error);
            }
        }

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Cashfree webhook error:', error);
        res.status(200).json({ ok: true });
    }
});

// Check order status (public, used for polling)
router.get('/status/:orderId', async (req: Request, res: Response) => {
    try {
        const paymentOrder = await prisma.paymentOrder.findUnique({
            where: { cfOrderId: req.params.orderId },
        });

        if (!paymentOrder) {
            return res.status(404).json({ error: 'Payment order not found' });
        }

        if (paymentOrder.status === 'CREATED') {
            const cfStatus = await CashfreeService.getOrderStatus(req.params.orderId);
            if (cfStatus.success && cfStatus.orderStatus === 'PAID') {
                await prisma.paymentOrder.update({
                    where: { id: paymentOrder.id },
                    data: { status: 'PAID' },
                });

                await WalletService.credit(
                    paymentOrder.merchantId,
                    Number(paymentOrder.amount),
                    `Wallet recharge via Cashfree`,
                    req.params.orderId,
                );

                return res.json({ status: 'PAID', amount: Number(paymentOrder.amount) });
            }
        }

        res.json({ status: paymentOrder.status, amount: Number(paymentOrder.amount) });
    } catch (error: any) {
        console.error('Payment status check error:', error);
        res.status(500).json({ error: error.message || 'Failed to check payment status' });
    }
});

export const paymentsRouter = router;
