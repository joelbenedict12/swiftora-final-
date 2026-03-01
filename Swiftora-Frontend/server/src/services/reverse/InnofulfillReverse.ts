/**
 * INNOFULFILL REVERSE PICKUP
 * 
 * Same booking API with orderType: "REVERSE"
 * Addresses are semantically opposite for reverse:
 *   drop_location = customer address (pickup from)
 *   pickup_location = seller warehouse (deliver to)
 */
import axios from 'axios';

const INNOFULFILL_BASE = process.env.INNOFULFILL_BASE_URL || 'https://qaapis.delcaper.com';

async function getInnofulfillToken(): Promise<string> {
    try {
        const { innofulfillService } = await import('../courier/InnofulfillService.js');
        return (innofulfillService as any).getAuthToken?.() || process.env.INNOFULFILL_TOKEN || '';
    } catch {
        return process.env.INNOFULFILL_TOKEN || '';
    }
}

export async function createInnofulfillReverse(forward: any, reverseOrder: any, req: any) {
    const warehouse = forward.warehouse;
    const token = await getInnofulfillToken();

    const body = [{
        orderId: reverseOrder.orderNumber,
        orderDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
        orderType: 'REVERSE', // KEY: makes it reverse
        autoManifest: true,
        deliveryType: 'SURFACE',
        deliveryPromise: 'STANDARD',
        addresses: {
            // For reverse: pickup = customer, delivery = warehouse
            pickup: {
                zip: forward.shippingPincode,
                name: forward.customerName,
                phone: req.phone || forward.customerPhone,
                email: forward.customerEmail || '',
                street: req.address || forward.shippingAddress,
                city: forward.shippingCity,
                state: forward.shippingState,
                country: 'India',
            },
            delivery: {
                zip: warehouse?.pincode || '',
                name: warehouse?.name || 'Warehouse',
                phone: warehouse?.phone || forward.customerPhone,
                email: '',
                street: warehouse?.address || '',
                city: warehouse?.city || '',
                state: warehouse?.state || '',
                country: 'India',
            },
            return: {
                zip: warehouse?.pincode || '',
                name: warehouse?.name || 'Warehouse',
                phone: warehouse?.phone || forward.customerPhone,
                email: '',
                street: warehouse?.address || '',
                city: warehouse?.city || '',
                state: warehouse?.state || '',
                country: 'India',
            },
        },
        shipments: [{
            dimensions: {
                length: forward.length ? Number(forward.length) : 10,
                width: forward.breadth ? Number(forward.breadth) : 10,
                height: forward.height ? Number(forward.height) : 10,
            },
            physicalWeight: Number(forward.weight) * 1000,
            items: [{
                name: forward.productName,
                quantity: forward.quantity || 1,
                weight: Number(forward.weight) * 1000,
                unitPrice: Number(forward.productValue),
                sku: reverseOrder.orderNumber,
            }],
        }],
        payment: {
            finalAmount: Number(forward.productValue),
            status: 'PAID',
            currency: 'INR',
        },
    }];

    const response = await axios.post(
        `${INNOFULFILL_BASE}/booking/order/`,
        body,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'async': 'false',
            },
        }
    );

    const data = response.data;
    const orderData = data?.data?.[0];

    if (orderData?.trackingId) {
        return {
            success: true,
            awbNumber: String(orderData.trackingId),
            message: 'Innofulfill reverse booked',
            raw: data,
        };
    }

    const err = data?.errors?.[0];
    return {
        success: false,
        message: err?.errorMessage || 'Innofulfill reverse booking failed',
        raw: data,
    };
}
