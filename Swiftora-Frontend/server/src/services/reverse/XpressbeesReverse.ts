/**
 * XPRESSBEES REVERSE PICKUP
 * 
 * Dedicated endpoint: POST /api/reverseshipments
 * consignee = customer (where to pick up from)
 * pickup = warehouse (where to return to)
 */
import axios from 'axios';

const XPRESSBEES_BASE = 'https://shipment.xpressbees.com';

function getToken(): string {
    const raw = process.env.XPRESSBEES_TOKEN || '';
    return raw.replace(/^Bearer\s+/i, '').trim();
}

export async function createXpressbeesReverse(forward: any, reverseOrder: any, req: any) {
    const warehouse = forward.warehouse;

    const body = {
        order_id: reverseOrder.orderNumber,
        request_auto_pickup: 'yes',
        consignee: {
            name: forward.customerName,
            address: req.address || forward.shippingAddress,
            address_2: '',
            city: forward.shippingCity,
            state: forward.shippingState,
            pincode: forward.shippingPincode,
            phone: req.phone || forward.customerPhone,
        },
        pickup: {
            warehouse_name: warehouse?.name || 'Default Warehouse',
            name: warehouse?.name || 'Warehouse',
            address: warehouse?.address || '',
            address_2: '',
            city: warehouse?.city || '',
            state: warehouse?.state || '',
            pincode: warehouse?.pincode || '',
            phone: warehouse?.phone || forward.customerPhone,
        },
        product_name: forward.productName,
        product_qty: String(forward.quantity || 1),
        product_amount: String(Number(forward.productValue)),
        package_weight: Number(forward.weight) * 1000, // kg → grams
        package_length: forward.length ? String(Number(forward.length)) : '10',
        package_breadth: forward.breadth ? String(Number(forward.breadth)) : '10',
        package_height: forward.height ? String(Number(forward.height)) : '10',
    };

    const response = await axios.post(
        `${XPRESSBEES_BASE}/api/reverseshipments`,
        body,
        {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const data = response.data;
    if (data?.status === true && data?.data?.awb_number) {
        return {
            success: true,
            awbNumber: String(data.data.awb_number),
            message: 'Xpressbees reverse booked',
            raw: data,
        };
    }

    return {
        success: false,
        message: data?.message || 'Xpressbees reverse booking failed',
        raw: data,
    };
}
