import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import * as WalletService from '../services/WalletService.js';
import * as CashfreeService from '../services/cashfreeService.js';
import { getMinRechargeAmount, getQrUrl } from '../services/commissionService.js';

const router = Router();

// All billing routes require authentication
router.use(authenticate);

// Get wallet balance + summary for the logged-in merchant
router.get('/wallet', async (req: AuthRequest, res, next) => {
    try {
        if (!req.user?.merchantId) throw new AppError(400, 'Merchant account required');

        const balance = await WalletService.getBalance(req.user.merchantId);

        const merchant = await prisma.merchant.findUnique({
            where: { id: req.user.merchantId },
            select: { isPaused: true, companyName: true },
        });

        res.json({
            ...balance,
            isPaused: merchant?.isPaused || false,
            companyName: merchant?.companyName || '',
        });
    } catch (error) {
        next(error);
    }
});

// Get transaction history for the logged-in merchant
router.get('/transactions', async (req: AuthRequest, res, next) => {
    try {
        if (!req.user?.merchantId) throw new AppError(400, 'Merchant account required');

        const { page, limit, type } = req.query;
        const result = await WalletService.getTransactions(req.user.merchantId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            type: type as string,
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Initiate wallet recharge via Cashfree
router.post('/recharge', async (req: AuthRequest, res, next) => {
    try {
        if (!req.user?.merchantId) throw new AppError(400, 'Merchant account required');

        const { amount } = req.body;
        if (!amount || Number(amount) <= 0) {
            throw new AppError(400, 'A positive amount is required');
        }

        const minRecharge = await getMinRechargeAmount();
        if (Number(amount) < minRecharge) {
            throw new AppError(400, `Minimum recharge amount is ₹${minRecharge}`);
        }

        const { configured } = CashfreeService.getCashfreeEnv();
        if (!configured) {
            throw new AppError(500, 'Payment gateway is not configured. Please contact support.');
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { name: true, email: true, phone: true },
        });
        if (!user) throw new AppError(404, 'User not found');

        const orderId = `SWFT_${req.user.merchantId.slice(-6)}_${Date.now()}`;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

        const cfResult = await CashfreeService.createOrder({
            orderId,
            amount: Number(amount),
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: user.phone,
            returnUrl: `${frontendUrl}/dashboard/billing?payment_status=success&order_id=${orderId}`,
            notifyUrl: `${backendUrl}/api/payments/webhook`,
        });

        if (!cfResult.success) {
            throw new AppError(500, cfResult.error || 'Failed to create payment order');
        }

        await prisma.paymentOrder.create({
            data: {
                merchantId: req.user.merchantId,
                cfOrderId: orderId,
                cfPaymentId: cfResult.cfOrderId,
                amount: Number(amount),
                status: 'CREATED',
                type: 'CASHFREE_RECHARGE',
            },
        });

        res.json({
            success: true,
            paymentSessionId: cfResult.paymentSessionId,
            cfOrderId: orderId,
            env: CashfreeService.getCashfreeEnv().env,
        });
    } catch (error) {
        next(error);
    }
});

// Submit QR payment ("I Paid")
router.post('/qr-payment', async (req: AuthRequest, res, next) => {
    try {
        if (!req.user?.merchantId) throw new AppError(400, 'Merchant account required');

        const { amount, utrReference } = req.body;
        if (!amount || Number(amount) <= 0) throw new AppError(400, 'A positive amount is required');
        if (!utrReference || String(utrReference).trim().length < 4) {
            throw new AppError(400, 'A valid UTR/transaction reference is required');
        }

        const minRecharge = await getMinRechargeAmount();
        if (Number(amount) < minRecharge) {
            throw new AppError(400, `Minimum recharge amount is ₹${minRecharge}`);
        }

        const txnResult = await WalletService.createPendingQrTransaction(
            req.user.merchantId,
            Number(amount),
            String(utrReference).trim(),
        );

        if (!txnResult.success) {
            throw new AppError(500, txnResult.error || 'Failed to create payment request');
        }

        await prisma.paymentOrder.create({
            data: {
                merchantId: req.user.merchantId,
                amount: Number(amount),
                status: 'PENDING',
                type: 'QR_PAYMENT',
                utrReference: String(utrReference).trim(),
            },
        });

        res.json({
            success: true,
            message: 'Payment submitted for admin approval',
            transactionId: txnResult.transactionId,
        });
    } catch (error) {
        next(error);
    }
});

// Get platform QR code URL
router.get('/qr-code', async (_req: AuthRequest, res, next) => {
    try {
        const qrUrl = await getQrUrl();
        const minRecharge = await getMinRechargeAmount();
        res.json({ qrUrl, minRechargeAmount: minRecharge });
    } catch (error) {
        next(error);
    }
});

// Check payment status (used after Cashfree redirect)
router.get('/payment-status/:orderId', async (req: AuthRequest, res, next) => {
    try {
        if (!req.user?.merchantId) throw new AppError(400, 'Merchant account required');

        const paymentOrder = await prisma.paymentOrder.findFirst({
            where: {
                cfOrderId: req.params.orderId,
                merchantId: req.user.merchantId,
            },
        });

        if (!paymentOrder) throw new AppError(404, 'Payment order not found');

        if (paymentOrder.status === 'CREATED') {
            const cfStatus = await CashfreeService.getOrderStatus(req.params.orderId);
            if (cfStatus.success && cfStatus.orderStatus === 'PAID') {
                await prisma.paymentOrder.update({
                    where: { id: paymentOrder.id },
                    data: { status: 'PAID' },
                });

                await WalletService.credit(
                    req.user.merchantId,
                    Number(paymentOrder.amount),
                    `Wallet recharge via Cashfree`,
                    req.params.orderId,
                );

                return res.json({ status: 'PAID', amount: Number(paymentOrder.amount) });
            }
        }

        res.json({ status: paymentOrder.status, amount: Number(paymentOrder.amount) });
    } catch (error) {
        next(error);
    }
});

export const billingRouter = router;
