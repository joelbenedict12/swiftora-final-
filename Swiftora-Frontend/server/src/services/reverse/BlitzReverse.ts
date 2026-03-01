/**
 * BLITZ REVERSE PICKUP (also used for Ekart)
 * 
 * Same /v1/waybill/ endpoint with returnShipmentFlag: "true"
 * pickupAddressDetails = customer (pickup from)
 * deliveryAddressDetails = warehouse (deliver to)
 */
import axios from 'axios';

const BLITZ_BASE = process.env.BLITZ_BASE_URL || 'https://xv24xrhpxa.execute-api.ap-south-1.amazonaws.com';
const BLITZ_TOKEN = process.env.BLITZ_TOKEN || '';

export async function createBlitzReverse(forward: any, reverseOrder: any, req: any) {
    const warehouse = forward.warehouse;

    const body: any = {
        channelId: 'blitz',
        returnShipmentFlag: 'true', // KEY: makes it reverse
        Shipment: {
            code: reverseOrder.orderNumber,
            orderCode: reverseOrder.orderNumber,
            weight: Number(forward.weight) * 1000, // kg → grams
            length: forward.length ? Number(forward.length) : 10,
            height: forward.height ? Number(forward.height) : 10,
            breadth: forward.breadth ? Number(forward.breadth) : 10,
            items: [
                {
                    name: forward.productName,
                    description: forward.productName,
                    quantity: String(forward.quantity || 1),
                    item_value: String(Number(forward.productValue)),
                    skuCode: reverseOrder.orderNumber,
                    additional: {
                        return_reason: req.reason || 'Customer return',
                    },
                },
            ],
        },
        // For reverse: pickup = customer address, delivery = warehouse
        pickupAddressDetails: {
            name: forward.customerName,
            email: forward.customerEmail || '',
            phone: req.phone || forward.customerPhone,
            address1: req.address || forward.shippingAddress,
            address2: '',
            pincode: forward.shippingPincode,
            city: forward.shippingCity,
            state: forward.shippingState,
            country: 'India',
        },
        deliveryAddressDetails: {
            name: warehouse?.name || 'Warehouse',
            email: '',
            phone: warehouse?.phone || forward.customerPhone,
            address1: warehouse?.address || '',
            address2: '',
            pincode: warehouse?.pincode || '',
            city: warehouse?.city || '',
            state: warehouse?.state || '',
            country: 'India',
        },
        currencyCode: 'INR',
        paymentMode: 'Prepaid',
        totalAmount: String(Number(forward.productValue)),
        collectableAmount: '0',
    };

    const response = await axios.post(
        `${BLITZ_BASE}/v1/waybill/`,
        body,
        {
            headers: {
                'Authorization': BLITZ_TOKEN,
                'Content-Type': 'application/json',
            },
        }
    );

    const data = response.data;
    if (data?.status === 'SUCCESS' && data?.waybill) {
        return {
            success: true,
            awbNumber: data.waybill,
            message: 'Blitz reverse booked',
            raw: data,
        };
    }

    return {
        success: false,
        message: data?.message || 'Blitz reverse booking failed',
        raw: data,
    };
}
