import crypto from 'crypto';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';
const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || '';

const BASE_URL = CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const API_VERSION = '2025-01-01';

interface CashfreeOrderRequest {
    orderId: string;
    amount: number;
    currency?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    returnUrl: string;
    notifyUrl?: string;
}

interface CashfreeOrderResponse {
    success: boolean;
    cfOrderId?: string;
    paymentSessionId?: string;
    orderStatus?: string;
    error?: string;
}

export async function createOrder(req: CashfreeOrderRequest): Promise<CashfreeOrderResponse> {
    try {
        const body = {
            order_id: req.orderId,
            order_amount: req.amount,
            order_currency: req.currency || 'INR',
            customer_details: {
                customer_id: req.orderId.split('_')[0] || 'customer',
                customer_name: req.customerName,
                customer_email: req.customerEmail,
                customer_phone: req.customerPhone,
            },
            order_meta: {
                return_url: req.returnUrl,
                notify_url: req.notifyUrl || undefined,
            },
        };

        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION,
            },
            body: JSON.stringify(body),
        });

        const data: any = await response.json();

        if (!response.ok) {
            console.error('Cashfree createOrder error:', data);
            return {
                success: false,
                error: data?.message || `Cashfree API error: ${response.status}`,
            };
        }

        return {
            success: true,
            cfOrderId: data.cf_order_id?.toString(),
            paymentSessionId: data.payment_session_id,
            orderStatus: data.order_status,
        };
    } catch (error: any) {
        console.error('Cashfree createOrder exception:', error);
        return { success: false, error: error.message };
    }
}

export async function getOrderStatus(orderId: string): Promise<{
    success: boolean;
    orderStatus?: string;
    cfOrderId?: string;
    paymentMethod?: string;
    error?: string;
}> {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION,
            },
        });

        const data: any = await response.json();

        if (!response.ok) {
            return { success: false, error: data?.message || `Error: ${response.status}` };
        }

        return {
            success: true,
            orderStatus: data.order_status,
            cfOrderId: data.cf_order_id?.toString(),
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export function verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    if (!CASHFREE_WEBHOOK_SECRET) {
        console.warn('CASHFREE_WEBHOOK_SECRET not configured, skipping signature verification');
        return true;
    }

    try {
        const payload = timestamp + rawBody;
        const expectedSignature = crypto
            .createHmac('sha256', CASHFREE_WEBHOOK_SECRET)
            .update(payload)
            .digest('base64');
        return expectedSignature === signature;
    } catch (e) {
        console.error('Webhook signature verification error:', e);
        return false;
    }
}

export function getCashfreeEnv() {
    return {
        env: CASHFREE_ENV,
        configured: !!CASHFREE_APP_ID && !!CASHFREE_SECRET_KEY,
    };
}
