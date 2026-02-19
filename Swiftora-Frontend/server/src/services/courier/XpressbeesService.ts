/**
 * XPRESSBEES COURIER SERVICE
 * 
 * Integration with Xpressbees Custom API.
 * Base URL: https://shipment.xpressbees.com
 */

import axios, { AxiosInstance } from 'axios';
import {
    ICourierService,
    CourierName,
    CreateShipmentRequest,
    CreateShipmentResponse,
    TrackShipmentRequest,
    TrackShipmentResponse,
    CancelShipmentRequest,
    CancelShipmentResponse,
    CalculateRateRequest,
    CalculateRateResponse,
    CheckServiceabilityRequest,
    CheckServiceabilityResponse,
    TrackingEvent,
} from './types.js';

const XPRESSBEES_BASE_URL = process.env.XPRESSBEES_BASE_URL || 'https://shipment.xpressbees.com';

interface TokenCache {
    token: string;
    expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export interface XpressbeesServiceOption {
    id: string;
    name: string;
    freight_charges: number;
    cod_charges: number;
    total_charges: number;
    min_weight?: number;
    chargeable_weight?: number;
}

export interface XpressbeesPricingResponse {
    success: boolean;
    services: XpressbeesServiceOption[];
    error?: string;
}

export interface NormalizedPricingOption {
    courier: 'XPRESSBEES';
    service_id: string;
    service_name: string;
    freight: number;
    cod: number;
    total: number;
    chargeable_weight?: number;
}

export interface XpressbeesNdrItem {
    awb_number: string;
    event_date: string;
    courier_remarks: string;
    total_attempts: string;
}

export interface NdrAction {
    type: 'RE_ATTEMPT' | 'CHANGE_ADDRESS' | 'CHANGE_PHONE';
    awbNumber: string;
    reAttemptDate?: string;
    newName?: string;
    newAddress1?: string;
    newAddress2?: string;
    newPhone?: string;
}

export interface XpressbeesNdrCreateItem {
    awb: string;
    action: 're-attempt' | 'change_address' | 'change_phone';
    action_data: {
        re_attempt_date?: string;
        name?: string;
        address_1?: string;
        address_2?: string;
        phone?: string;
    };
}

export class XpressbeesService implements ICourierService {
    readonly name: CourierName = 'XPRESSBEES';

    // Credentials from environment
    private get email(): string {
        return process.env.XPRESSBEES_EMAIL || '';
    }

    private get password(): string {
        return process.env.XPRESSBEES_PASSWORD || '';
    }

    constructor() {
        console.log('XpressbeesService initialized');
    }

    /**
     * Login to Xpressbees and get JWT token
     * POST https://shipment.xpressbees.com/api/users/login
     */
    private async login(): Promise<string> {
        console.log('=== XPRESSBEES LOGIN ===');
        console.log(`Email: ${this.email}`);
        console.log(`Password: ${this.password ? '***' + this.password.slice(-3) : 'NOT SET'}`);

        if (!this.email || !this.password) {
            throw new Error('XPRESSBEES_EMAIL and XPRESSBEES_PASSWORD must be set in environment');
        }

        try {
            const response = await axios.post(
                `${XPRESSBEES_BASE_URL}/api/users/login`,
                {
                    email: this.email,
                    password: this.password
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            console.log('Login response status:', response.data.status);

            if (!response.data.status || !response.data.data) {
                console.error('Login failed:', JSON.stringify(response.data));
                throw new Error('Login failed: ' + (response.data.message || 'Unknown error'));
            }

            // Token is returned directly in data field as a string
            const token = response.data.data;
            console.log(`Token received: length=${token.length}, starts=${token.substring(0, 20)}...`);

            // Cache the token (JWT tokens typically expire in 3 hours based on user's exp claim)
            tokenCache = {
                token: token,
                expiresAt: Date.now() + (3 * 60 * 60 * 1000) - (5 * 60 * 1000) // 3 hours minus 5 min buffer
            };

            return token;
        } catch (error: any) {
            console.error('=== XPRESSBEES LOGIN ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Data:', JSON.stringify(error.response?.data));
            console.error('Message:', error.message);
            throw new Error(`Xpressbees login failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get valid token (from cache or fresh login)
     */
    private async getToken(): Promise<string> {
        // Check if we have a valid cached token
        if (tokenCache && tokenCache.expiresAt > Date.now()) {
            console.log('Using cached Xpressbees token');
            return tokenCache.token;
        }

        // Otherwise login to get a fresh token
        console.log('Token expired or not cached, logging in...');
        return await this.login();
    }

    /**
     * Clear token cache (for retry on 401)
     */
    private clearTokenCache(): void {
        console.log('Clearing Xpressbees token cache');
        tokenCache = null;
    }

    /**
     * Create authenticated axios client
     */
    private async getClient(): Promise<AxiosInstance> {
        const token = await this.getToken();

        console.log('=== XPRESSBEES CLIENT ===');
        console.log(`Token length: ${token.length}`);
        console.log(`Base URL: ${XPRESSBEES_BASE_URL}`);

        const client = axios.create({
            baseURL: XPRESSBEES_BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        return client;
    }

    /**
     * Make API request with automatic retry on 401
     */
    private async makeRequest<T>(
        method: 'GET' | 'POST',
        url: string,
        data?: any,
        retryOnAuth: boolean = true
    ): Promise<T> {
        try {
            const client = await this.getClient();

            console.log(`=== XPRESSBEES ${method} ${url} ===`);
            if (data) console.log('Payload:', JSON.stringify(data));

            const response = method === 'GET'
                ? await client.get(url)
                : await client.post(url, data);

            console.log('Response:', JSON.stringify(response.data));
            return response.data;
        } catch (error: any) {
            console.error(`=== XPRESSBEES ERROR ${method} ${url} ===`);
            console.error('Status:', error.response?.status);
            console.error('Data:', JSON.stringify(error.response?.data));

            // If 401 and we haven't retried yet, clear cache and retry
            if (error.response?.status === 401 && retryOnAuth) {
                console.log('Got 401, clearing token and retrying...');
                this.clearTokenCache();
                return this.makeRequest<T>(method, url, data, false);
            }

            throw error;
        }
    }

    async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
        try {
            const client = await this.getClient();
            const weightInGrams = Math.round(request.weight * 1000);

            // Helper: Sanitize phone to exactly 10 digits (Indian format)
            const sanitizePhone = (phone: string | undefined): string => {
                if (!phone) return '9999999999'; // Default fallback
                // Remove all non-digit characters
                const digits = phone.replace(/\D/g, '');
                // If starts with 91 and has 12 digits, remove 91
                if (digits.startsWith('91') && digits.length === 12) {
                    return digits.slice(2);
                }
                // If starts with 0 and has 11 digits, remove 0
                if (digits.startsWith('0') && digits.length === 11) {
                    return digits.slice(1);
                }
                // Take last 10 digits if longer
                if (digits.length > 10) {
                    return digits.slice(-10);
                }
                // If less than 10, pad with 9s (shouldn't happen with valid data)
                return digits.padStart(10, '9');
            };

            // Log incoming request for debugging
            console.log('=== XPRESSBEES CREATE SHIPMENT - INPUT ===');
            console.log('Request:', JSON.stringify(request, null, 2));

            // Xpressbees order creation payload - EXACT format from API docs
            const payload = {
                // Order Info
                order_number: String(request.orderNumber || ''),
                unique_order_number: 'yes',

                // Charges
                shipping_charges: 0,
                discount: 0,
                cod_charges: 0,

                // Payment
                payment_type: request.paymentMode === 'COD' ? 'cod' : 'prepaid',
                order_amount: Number(request.totalAmount || request.productValue || 0),
                collectable_amount: String(request.paymentMode === 'COD'
                    ? (request.codAmount || request.totalAmount || request.productValue || 0)
                    : 0),

                // Package dimensions
                package_weight: weightInGrams || 500,
                package_length: Number(request.length) || 10,
                package_breadth: Number(request.breadth) || 10,
                package_height: Number(request.height) || 10,

                // Auto pickup
                request_auto_pickup: 'yes',

                // Consignee (Recipient) - NESTED OBJECT
                consignee: {
                    name: String(request.customerName || ''),
                    address: String(request.shippingAddress || ''),
                    address_2: String(request.shippingAddress2 || ''),
                    city: String(request.shippingCity || ''),
                    state: String(request.shippingState || ''),
                    pincode: String(request.shippingPincode || ''),
                    phone: sanitizePhone(request.customerPhone), // Exactly 10 digits
                },

                // Pickup (Sender) - NESTED OBJECT
                pickup: {
                    warehouse_name: String(request.pickupName || 'Default Warehouse'),
                    name: String(request.pickupName || 'Swiftora'),
                    address: String(request.pickupAddress || ''),
                    address_2: String(request.pickupAddress2 || ''),
                    city: String(request.pickupCity || ''),
                    state: String(request.pickupState || ''),
                    pincode: String(request.pickupPincode || ''),
                    phone: sanitizePhone(request.pickupPhone), // Exactly 10 digits
                },

                // Order Items - ARRAY format
                order_items: [{
                    name: String(request.productName || 'Product'),
                    qty: String(request.quantity || 1),
                    price: String(request.productValue || 0),
                    sku: String(request.orderNumber || 'SKU001'),
                }],

                // Courier ID (service selected from pricing; defaults to first service if not set)
                courier_id: String(request.serviceId || (request as any).serviceId || ''),
            };

            console.log('=== XPRESSBEES CREATE SHIPMENT - PAYLOAD ===');
            console.log('Payload:', JSON.stringify(payload, null, 2));

            const response = await client.post('/api/shipments2', payload);

            console.log('Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === true && response.data?.data?.awb_number) {
                return {
                    success: true,
                    awbNumber: response.data.data.awb_number,
                    courierName: 'XPRESSBEES',
                    labelUrl: response.data.data.label_url,
                    trackingUrl: response.data.data.tracking_url,
                    rawResponse: response.data,
                };
            }
            return {
                success: false,
                courierName: 'XPRESSBEES',
                error: response.data?.message || 'Failed to create shipment',
                rawResponse: response.data
            };
        } catch (error: any) {
            console.error('=== XPRESSBEES CREATE SHIPMENT ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Full Error Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error Message:', error.message);

            return {
                success: false,
                courierName: 'XPRESSBEES',
                error: error.response?.data?.message || error.response?.data?.error || error.message,
                rawResponse: error.response?.data
            };
        }
    }

    async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
        try {
            const client = await this.getClient();
            const trackingId = request.awbNumber || request.orderNumber;
            if (!trackingId) throw new Error('Tracking ID required');

            const response = await client.get(`/api/shipments2/track/${trackingId}`);
            const events: TrackingEvent[] = [];
            const trackData = response.data?.data;

            if (trackData?.scans && Array.isArray(trackData.scans)) {
                for (const scan of trackData.scans) {
                    events.push({
                        status: scan.status || scan.activity,
                        statusCode: scan.status_code,
                        location: scan.location,
                        timestamp: new Date(scan.timestamp || scan.date),
                        remarks: scan.remarks,
                    });
                }
            }

            // Xpressbees may not return current_status; use the scan with latest timestamp as fallback
            let currentStatus = trackData?.current_status;
            if (!currentStatus && trackData?.scans?.length) {
                const byTime = [...trackData.scans].sort(
                    (a, b) => new Date(b.timestamp || b.date || 0).getTime() - new Date(a.timestamp || a.date || 0).getTime()
                );
                const latest = byTime[0];
                currentStatus = latest?.status || latest?.activity;
            }

            return {
                success: response.data?.status === true,
                awbNumber: trackData?.awb_number || trackingId,
                currentStatus,
                events,
                rawResponse: response.data,
            };
        } catch (error: any) {
            return { success: false, events: [], error: error.message };
        }
    }

    /**
     * Cancel shipment via Xpressbees API.
     * POST /api/shipments2/cancel with body { "awb": "<awb_number>" }
     */
    async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
        try {
            const client = await this.getClient();
            const response = await client.post('/api/shipments2/cancel', {
                awb: request.awbNumber,
            });
            return {
                success: response.data?.status === true,
                message: response.data?.message || 'Shipment Cancelled',
            };
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;
            return { success: false, error: msg };
        }
    }

    async checkServiceabilityWithPricing(request: {
        origin: string;
        destination: string;
        payment_type: 'cod' | 'prepaid';
        order_amount: number;
        weight: number;
        length: number;
        breadth: number;
        height: number;
    }): Promise<XpressbeesPricingResponse> {
        console.log('=== XPRESSBEES PRICING REQUEST ===');
        console.log('Request:', JSON.stringify(request, null, 2));

        try {
            const client = await this.getClient();
            const payload = {
                origin: request.origin,
                destination: request.destination,
                payment_type: request.payment_type,
                order_amount: request.order_amount.toString(),
                weight: request.weight.toString(),
                length: request.length.toString(),
                breadth: request.breadth.toString(),
                height: request.height.toString(),
            };

            console.log('Payload:', JSON.stringify(payload, null, 2));

            const response = await client.post('/api/courier/serviceability', payload);

            console.log('Response:', JSON.stringify(response.data, null, 2));

            const services: XpressbeesServiceOption[] = [];

            if (response.data?.status === true && Array.isArray(response.data.data)) {
                for (const svc of response.data.data) {
                    services.push({
                        id: svc.id?.toString() || '',
                        name: svc.name || '',
                        freight_charges: Number(svc.freight_charges) || 0,
                        cod_charges: Number(svc.cod_charges) || 0,
                        total_charges: Number(svc.total_charges) || 0,
                        chargeable_weight: Number(svc.chargeable_weight) || 0,
                    });
                }
            }

            return { success: services.length > 0, services, error: services.length === 0 ? 'No services available' : undefined };
        } catch (error: any) {
            console.error('=== XPRESSBEES PRICING ERROR ===');
            console.error('Error message:', error.message);
            console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error status:', error.response?.status);
            return { success: false, services: [], error: error.response?.data?.message || error.message };
        }
    }

    normalizePricingResponse(services: XpressbeesServiceOption[]): NormalizedPricingOption[] {
        return services.map(svc => ({
            courier: 'XPRESSBEES' as const,
            service_id: svc.id,
            service_name: svc.name,
            freight: svc.freight_charges,
            cod: svc.cod_charges,
            total: svc.total_charges,
            chargeable_weight: svc.chargeable_weight,
        }));
    }

    async getNdrList(): Promise<{ success: boolean; items: XpressbeesNdrItem[]; error?: string }> {
        try {
            const client = await this.getClient();
            const response = await client.get('/api/ndr');
            const items: XpressbeesNdrItem[] = [];

            if (response.data?.status === true && Array.isArray(response.data.data)) {
                for (const item of response.data.data) {
                    items.push({
                        awb_number: item.awb_number || '',
                        event_date: item.event_date || '',
                        courier_remarks: item.courier_remarks || '',
                        total_attempts: item.total_attempts || '0',
                    });
                }
            }
            return { success: true, items };
        } catch (error: any) {
            return { success: false, items: [], error: error.message };
        }
    }

    async createNdrAction(actions: NdrAction[]): Promise<{ success: boolean; results: any[]; error?: string }> {
        try {
            const client = await this.getClient();
            const payload: XpressbeesNdrCreateItem[] = actions.map(action => {
                const item: XpressbeesNdrCreateItem = {
                    awb: action.awbNumber,
                    action: action.type === 'RE_ATTEMPT' ? 're-attempt' : action.type === 'CHANGE_ADDRESS' ? 'change_address' : 'change_phone',
                    action_data: {},
                };
                if (action.type === 'RE_ATTEMPT' && action.reAttemptDate) item.action_data.re_attempt_date = action.reAttemptDate;
                if (action.type === 'CHANGE_ADDRESS') {
                    if (action.newName) item.action_data.name = action.newName;
                    if (action.newAddress1) item.action_data.address_1 = action.newAddress1;
                    if (action.newAddress2) item.action_data.address_2 = action.newAddress2;
                }
                if (action.type === 'CHANGE_PHONE' && action.newPhone) item.action_data.phone = action.newPhone;
                return item;
            });

            const response = await client.post('/api/ndr/create', payload);
            return { success: true, results: Array.isArray(response.data) ? response.data : [response.data] };
        } catch (error: any) {
            return { success: false, results: [], error: error.message };
        }
    }

    async calculateRate(request: CalculateRateRequest): Promise<CalculateRateResponse> {
        const result = await this.checkServiceabilityWithPricing({
            origin: request.originPincode,
            destination: request.destinationPincode,
            payment_type: request.paymentMode === 'COD' ? 'cod' : 'prepaid',
            order_amount: request.codAmount || 0,
            weight: Math.round(request.weight * 1000),
            length: 10, breadth: 10, height: 10,
        });

        if (!result.success || result.services.length === 0) {
            return { success: false, error: result.error || 'No services' };
        }

        const lowestRate = result.services.reduce((min, svc) => svc.total_charges < min.total_charges ? svc : min);
        return { success: true, rate: lowestRate.total_charges, currency: 'INR' };
    }

    async checkServiceability(request: CheckServiceabilityRequest): Promise<CheckServiceabilityResponse> {
        const result = await this.checkServiceabilityWithPricing({
            origin: '400001',
            destination: request.pincode,
            payment_type: 'prepaid',
            order_amount: 500,
            weight: 500,
            length: 10, breadth: 10, height: 10,
        });
        return { success: result.success, serviceable: result.services.length > 0, error: result.error };
    }
}

export const xpressbeesService = new XpressbeesService();
