/**
 * DELHIVERY REVERSE PICKUP
 * 
 * Uses same /api/cmu/create.json endpoint with payment_mode: "Pickup"
 * Customer info = pickup location, return fields = drop/delivery address (warehouse)
 */
import axios from 'axios';

const DELHIVERY_BASE = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN || '';

export async function createDelhiveryReverse(forward: any, reverseOrder: any, req: any) {
    const warehouse = forward.warehouse;

    const shipmentData = {
        shipments: [
            {
                name: forward.customerName,
                add: req.address || forward.shippingAddress,
                pin: forward.shippingPincode,
                city: forward.shippingCity,
                state: forward.shippingState,
                country: 'India',
                phone: req.phone || forward.customerPhone,
                order: reverseOrder.orderNumber,
                payment_mode: 'Pickup', // KEY: makes it reverse
                return_name: warehouse?.name || forward.customerName,
                return_add: warehouse?.address || '',
                return_city: warehouse?.city || '',
                return_state: warehouse?.state || '',
                return_pin: warehouse?.pincode || '',
                return_phone: warehouse?.phone || forward.customerPhone,
                return_country: 'India',
                products_desc: forward.productName,
                weight: Number(forward.weight) * 1000, // kg → grams
                shipment_height: forward.height ? Number(forward.height) : undefined,
                shipment_width: forward.breadth ? Number(forward.breadth) : undefined,
                shipment_length: forward.length ? Number(forward.length) : undefined,
                total_amount: Number(forward.productValue),
                shipping_mode: 'Surface',
                waybill: '',
            },
        ],
        pickup_location: {
            name: warehouse?.delhiveryName || warehouse?.name || 'Default Warehouse',
        },
    };

    const response = await axios.post(
        `${DELHIVERY_BASE}/api/cmu/create.json`,
        `format=json&data=${JSON.stringify(shipmentData)}`,
        {
            headers: {
                'Authorization': `Token ${DELHIVERY_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        }
    );

    const data = response.data;
    const pkg = data?.packages?.[0] || data?.upload_wbn?.packages?.[0];
    const awb = pkg?.waybill || '';

    if (awb && !pkg?.remarks?.toLowerCase().includes('fail')) {
        return { success: true, awbNumber: awb, message: 'Delhivery reverse booked', raw: data };
    }

    return {
        success: false,
        message: pkg?.remarks || data?.rmk || 'Delhivery reverse booking failed',
        raw: data,
    };
}
