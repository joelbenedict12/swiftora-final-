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

    constructor() {
        // Token is read at runtime in getToken() to ensure env vars are loaded
    }

    /**
     * Get token from environment at runtime (not at module load time)
     */
    private getToken(): string {
        const rawToken = process.env.XPRESSBEES_TOKEN || '';
        // Remove 'Bearer ' prefix if user added it, and trim whitespace
        const token = rawToken.replace(/^Bearer\s+/i, '').trim();
        console.log(`XpressbeesService: Token at runtime: ${token ? 'YES (length: ' + token.length + ')' : 'NO'}`);
        return token;
    }

    private async authenticate(): Promise<string> {
        // Read token fresh at request time (not from constructor)
        const token = this.getToken();
        if (token) return token;

        if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
            return tokenCache.token;
        }

        // No token set - try username/password auth
        const username = process.env.XPRESSBEES_USERNAME || '';
        const password = process.env.XPRESSBEES_PASSWORD || '';

        try {
            console.log('XpressbeesService: Auto-authenticating with username/password...');
            const response = await axios.post(
                `${XPRESSBEES_BASE_URL}/api/auth/token`,
                { username, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            // Handle different response formats (data as string or object)
            let authToken = response.data.token;
            if (!authToken && response.data.data) {
                if (typeof response.data.data === 'string') {
                    authToken = response.data.data;
                } else {
                    authToken = response.data.data.token;
                }
            }

            if (!authToken) {
                console.error('Xpressbees Auth Response:', JSON.stringify(response.data));
                throw new Error('No token in response');
            }

            tokenCache = {
                token: authToken,
                expiresAt: Date.now() + (response.data.expires_in || 86400) * 1000 - 3600000,
            };
            return tokenCache.token;
        } catch (error: any) {
            throw new Error(`Xpressbees auth failed: ${error.message}`);
        }
    }

    private async getClient(): Promise<AxiosInstance> {
        const token = await this.authenticate();
        // Ensure token doesn't already have Bearer in case logic changes
        const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

        // Log for debugging
        console.log(`=== XPRESSBEES CLIENT SETUP ===`);
        console.log(`Token length: ${cleanToken.length}`);
        console.log(`Token starts with: ${cleanToken.substring(0, 20)}...`);
        console.log(`Token ends with: ...${cleanToken.substring(cleanToken.length - 20)}`);
        console.log(`Base URL: ${XPRESSBEES_BASE_URL}`);

        const authHeader = `Bearer ${cleanToken}`;
        console.log(`Authorization header: ${authHeader.substring(0, 30)}...`);

        // Per Xpressbees docs: Authorization header with Bearer token
        const client = axios.create({
            baseURL: XPRESSBEES_BASE_URL,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
        });

        // Add request interceptor to log exact request
        client.interceptors.request.use((config) => {
            console.log(`=== XPRESSBEES REQUEST ===`);
            console.log(`URL: ${config.baseURL}${config.url}`);
            console.log(`Method: ${config.method}`);
            console.log(`Headers:`, JSON.stringify(config.headers, null, 2));
            return config;
        });

        // Add response interceptor to log response
        client.interceptors.response.use(
            (response) => {
                console.log(`=== XPRESSBEES RESPONSE SUCCESS ===`);
                console.log(`Status: ${response.status}`);
                console.log(`Data:`, JSON.stringify(response.data, null, 2));
                return response;
            },
            (error) => {
                console.log(`=== XPRESSBEES RESPONSE ERROR ===`);
                console.log(`Status: ${error.response?.status}`);
                console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
                return Promise.reject(error);
            }
        );

        return client;
    }

    async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
        try {
            const client = await this.getClient();
            const weightInGrams = Math.round(request.weight * 1000);

            const payload = {
                order_number: request.orderNumber,
                consignee_name: request.customerName,
                consignee_phone: request.customerPhone,
                consignee_email: request.customerEmail || '',
                consignee_address: request.shippingAddress,
                consignee_address_2: request.shippingAddress2 || '',
                consignee_city: request.shippingCity,
                consignee_state: request.shippingState,
                consignee_pincode: request.shippingPincode,
                pickup_name: request.pickupName,
                pickup_phone: request.pickupPhone,
                pickup_address: request.pickupAddress,
                pickup_address_2: request.pickupAddress2 || '',
                pickup_city: request.pickupCity,
                pickup_state: request.pickupState,
                pickup_pincode: request.pickupPincode,
                product_name: request.productName,
                product_quantity: request.quantity,
                product_value: request.productValue,
                weight: weightInGrams.toString(),
                length: (request.length || 10).toString(),
                breadth: (request.breadth || 10).toString(),
                height: (request.height || 10).toString(),
                payment_type: request.paymentMode === 'COD' ? 'cod' : 'prepaid',
                cod_amount: request.paymentMode === 'COD' ? (request.codAmount || request.totalAmount) : 0,
                order_amount: request.totalAmount.toString(),
            };

            const response = await client.post('/api/shipments/order', payload);

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
            return { success: false, courierName: 'XPRESSBEES', error: response.data?.message || 'Failed', rawResponse: response.data };
        } catch (error: any) {
            return { success: false, courierName: 'XPRESSBEES', error: error.response?.data?.message || error.message };
        }
    }

    async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
        try {
            const client = await this.getClient();
            const trackingId = request.awbNumber || request.orderNumber;
            if (!trackingId) throw new Error('Tracking ID required');

            const response = await client.get(`/api/shipments/track/${trackingId}`);
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

            return {
                success: response.data?.status === true,
                awbNumber: trackData?.awb_number || trackingId,
                currentStatus: trackData?.current_status,
                events,
                rawResponse: response.data,
            };
        } catch (error: any) {
            return { success: false, events: [], error: error.message };
        }
    }

    async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
        try {
            const client = await this.getClient();
            const response = await client.post('/api/shipments/cancel', {
                awb_number: request.awbNumber,
                order_number: request.orderNumber,
            });
            return { success: response.data?.status === true, message: response.data?.message || 'Cancelled' };
        } catch (error: any) {
            return { success: false, error: error.message };
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
