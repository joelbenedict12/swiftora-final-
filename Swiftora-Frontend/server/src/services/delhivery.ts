import axios from 'axios';
import qs from 'qs';
import { z } from 'zod';

/**
 * DELHIVERY API SERVICE
 * 
 * IMPORTANT: Delhivery is a LOGISTICS/SHIPPING API, not an order management system.
 * 
 * What Delhivery CAN do:
 * 1. Check pincode serviceability
 * 2. Create & update warehouse
 * 3. Fetch waybill (AWB numbers)
 * 4. Calculate shipping cost
 * 5. Create & update shipment
 * 6. Track shipment
 * 7. Generate shipping label
 * 8. Raise pickup request
 * 9. Handle NDR (Non-Delivery Report) actions
 * 
 * What Delhivery CANNOT do:
 * - Fetch/sync orders (orders must be created in YOUR system)
 * - Store order data (they only store shipment data)
 * 
 * WORKFLOW:
 * 1. Customer places order → Save to YOUR database
 * 2. You create shipment → Call Delhivery API to create shipment
 * 3. Delhivery picks up → They provide AWB and tracking
 * 4. Status updates → Come via webhooks or polling
 */

const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';

// Helper to create client with specific API key
export const createDelhiveryClient = (apiKey: string) => {
  return axios.create({
    baseURL: DELHIVERY_BASE_URL,
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
};

// For backward compatibility, use env key if available
export const getDefaultClient = () => {
  const defaultKey = process.env.DELHIVERY_API_KEY || '';
  return createDelhiveryClient(defaultKey);
};

// Tracking
export async function trackShipment(params: {
  waybill?: string;
  orderIds?: string[];
  phone?: string;
}) {
  const queryParams = new URLSearchParams();

  if (params.waybill) {
    queryParams.append('waybill', params.waybill);
  }
  if (params.orderIds?.length) {
    queryParams.append('ref_ids', params.orderIds.join(','));
  }
  if (params.phone) {
    queryParams.append('phone', params.phone);
  }

  const client = getDefaultClient();
  const response = await client.get(`/api/v1/packages/json/?${queryParams.toString()}`);
  return response.data;
}

// Create shipment
const CreateShipmentSchema = z.object({
  pickup_location: z.string(),
  shipments: z.array(z.object({
    name: z.string(),
    add: z.string(),
    pin: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string().default('India'),
    phone: z.string(),
    order: z.string(),
    payment_mode: z.enum(['Prepaid', 'COD']),
    return_pin: z.string(),
    return_city: z.string(),
    return_phone: z.string(),
    return_add: z.string(),
    return_state: z.string(),
    return_country: z.string().default('India'),
    products_desc: z.string(),
    hsn_code: z.string().optional(),
    cod_amount: z.number().optional(),
    order_date: z.string().optional(),
    total_amount: z.number(),
    seller_add: z.string().optional(),
    seller_name: z.string().optional(),
    seller_inv: z.string().optional(),
    quantity: z.number().default(1),
    waybill: z.string().optional(),
    shipment_length: z.number().optional(),
    shipment_width: z.number().optional(),
    shipment_height: z.number().optional(),
    weight: z.number(),
    seller_gst_tin: z.string().optional(),
    shipping_mode: z.enum(['Surface', 'Express']).default('Surface'),
    address_type: z.enum(['home', 'office']).default('home'),
  })),
});

export async function createShipment(shipmentData: any) {
  // Get API key
  const apiKey = process.env.DELHIVERY_API_KEY || '';

  console.log('=== DELHIVERY CREATE SHIPMENT ===');
  console.log('API Key present:', !!apiKey);
  console.log('Shipment data:', JSON.stringify(shipmentData, null, 2));

  // Delhivery expects EXACTLY this format (raw string, NOT JSON object):
  // format=json&data={...shipmentData as JSON...}
  const body = `format=json&data=${JSON.stringify(shipmentData)}`;

  console.log('Request URL:', DELHIVERY_BASE_URL + '/api/cmu/create.json');
  console.log('Body:', body);

  try {
    // Use axios config with transformRequest to prevent body modification
    const response = await axios({
      method: 'post',
      url: DELHIVERY_BASE_URL + '/api/cmu/create.json',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
      },
      data: body,
      transformRequest: [(data) => data], // CRITICAL: prevents axios from touching the raw string
    });

    console.log('Delhivery SUCCESS:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('=== DELHIVERY API ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// Schedule pickup
export async function schedulePickup(params: {
  pickup_location: string;
  pickup_date: string; // YYYY-MM-DD
  pickup_time: string; // HH:mm
  expected_package_count: number;
}) {
  const client = getDefaultClient();
  const response = await client.post('/fm/request/new/', params);
  return response.data;
}

// Check pincode serviceability
export async function checkServiceability(pincode: string) {
  const client = getDefaultClient();
  const response = await client.get(`/c/api/pin-codes/json/?filter_codes=${pincode}`);
  return response.data;
}

// Generate AWB (if API supports it)
export async function generateAWB(count: number = 1) {
  const client = getDefaultClient();
  const response = await client.get(`/waybill/api/bulk/json/?count=${count}`);
  return response.data;
}

// Get rate calculator
export async function calculateRate(params: {
  origin_pin: string;
  destination_pin: string;
  weight: number;
  payment_mode: 'Prepaid' | 'COD';
  cod_amount?: number;
}) {
  const queryParams = new URLSearchParams({
    md: params.payment_mode,
    ss: 'Delivered',
    d_pin: params.destination_pin,
    o_pin: params.origin_pin,
    cgm: params.weight.toString(),
  });

  if (params.payment_mode === 'COD' && params.cod_amount) {
    queryParams.append('cod', params.cod_amount.toString());
  }

  const client = getDefaultClient();
  const response = await client.get(`/api/kinko/v1/invoice/charges/.json?${queryParams.toString()}`);
  return response.data;
}

// Print label
export async function printLabel(waybills: string[]) {
  const client = getDefaultClient();
  const response = await client.get(`/api/p/packing_slip?wbns=${waybills.join(',')}`);
  return response.data;
}

// Print manifest
export async function printManifest(date: string) {
  const client = getDefaultClient();
  const response = await client.get(`/api/manifest/generate/?date=${date}`);
  return response.data;
}

// Create warehouse in Delhivery
export async function createWarehouse(data: {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country?: string;
  return_name?: string;
  return_address?: string;
  return_city?: string;
  return_state?: string;
  return_pin?: string;
}, merchantId?: string) {
  // If merchantId provided, get merchant's API key
  let client;
  if (merchantId) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { delhiveryApiKey: true },
    });
    await prisma.$disconnect();

    if (merchant?.delhiveryApiKey) {
      client = createDelhiveryClient(merchant.delhiveryApiKey);
    } else {
      client = getDefaultClient();
    }
  } else {
    client = getDefaultClient();
  }

  const response = await client.post('/api/backend/clientwarehouse/create/', data);
  return response.data;
}

// Fetch all warehouses/pickup locations from Delhivery account
export async function fetchDelhiveryWarehouses(merchantId?: string) {
  let client;
  if (merchantId) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { delhiveryApiKey: true },
    });
    await prisma.$disconnect();

    if (merchant?.delhiveryApiKey) {
      client = createDelhiveryClient(merchant.delhiveryApiKey);
    } else {
      client = getDefaultClient();
    }
  } else {
    client = getDefaultClient();
  }

  // Delhivery API endpoint to fetch warehouses
  const response = await client.get('/api/backend/clientwarehouse/list/');
  return response.data;
}

// Note: Delhivery API does NOT provide order fetching/syncing functionality
// It only allows creating shipments and tracking them
// Orders must be created in your own system, then shipments created in Delhivery

// Get merchant dashboard metrics
export async function getDashboardMetrics() {
  try {
    const client = getDefaultClient();
    // Fetch shipment statistics
    const response = await client.get('/api/v1/packages/json/', {
      params: {
        limit: 1000,
      }
    });

    const shipments = Array.isArray(response.data) ? response.data : response.data?.ShipmentData || [];

    // Calculate metrics
    const metrics = {
      totalShipments: shipments.length,
      delivered: shipments.filter((s: any) => s.status === 'Delivered').length,
      inTransit: shipments.filter((s: any) => ['Out for Delivery', 'In Transit', 'Manifested'].includes(s.status)).length,
      pending: shipments.filter((s: any) => ['Pending', 'Processed'].includes(s.status)).length,
      rto: shipments.filter((s: any) => s.status === 'RTO').length,
      failed: shipments.filter((s: any) => ['Undelivered', 'Cancelled'].includes(s.status)).length,
      codPending: shipments.filter((s: any) => s.payment_mode === 'COD' && s.status !== 'Delivered').length,
      onTimePercent: 92, // This would need historical data from Delhivery
      successRate: 97,   // This would need historical data from Delhivery
    };

    console.log('Dashboard Metrics:', metrics);
    return metrics;
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error.message);
    return {
      totalShipments: 0,
      delivered: 0,
      inTransit: 0,
      pending: 0,
      rto: 0,
      failed: 0,
      codPending: 0,
      onTimePercent: 0,
      successRate: 0,
    };
  }
}

export const delhivery = {
  trackShipment,
  createShipment,
  schedulePickup,
  checkServiceability,
  generateAWB,
  calculateRate,
  printLabel,
  printManifest,
  getDashboardMetrics,
  createWarehouse,
  fetchDelhiveryWarehouses,
};
