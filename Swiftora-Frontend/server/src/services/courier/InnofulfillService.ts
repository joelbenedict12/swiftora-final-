/**
 * INNOFULFILL COURIER SERVICE
 * 
 * Integration with Innofulfill (Delcaper) logistics API.
 * API Base: https://apis.delcaper.com
 * 
 * Features:
 * - JWT token authentication with caching
 * - Create shipments via /booking/order/
 * - Track shipments via /tracking/status/:trackingId
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
    TrackingEvent,
    CalculateRateRequest,
    CalculateRateResponse,
    CheckServiceabilityRequest,
    CheckServiceabilityResponse,
} from './types.js';

// Token cache for JWT
interface TokenCache {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export class InnofulfillService implements ICourierService {
    readonly name: CourierName = 'INNOFULFILL';

    private get baseUrl(): string {
        return process.env.INNOFULFILL_BASE_URL || 'https://apis.delcaper.com';
    }

    private get email(): string {
        return process.env.INNOFULFILL_EMAIL || 'swiftoralogistics@gmail.com';
    }

    private get password(): string {
        return process.env.INNOFULFILL_PASSWORD || 'Cagh@78686';
    }

    private tokenCache: TokenCache | null = null;

    constructor() {
        // Env vars are read dynamically via getters
    }

    /**
     * Login to get JWT token
     */
    private async login(): Promise<string> {
        try {
            // Debug: Log raw process.env values
            console.log('INNOFULFILL: === DEBUG ENV VARS ===');
            console.log('INNOFULFILL: Raw EMAIL from process.env:', process.env.INNOFULFILL_EMAIL);
            console.log('INNOFULFILL: Raw PASSWORD exists:', !!process.env.INNOFULFILL_PASSWORD);
            console.log('INNOFULFILL: Raw BASE_URL from process.env:', process.env.INNOFULFILL_BASE_URL);
            console.log('INNOFULFILL: All env keys containing INNO:', Object.keys(process.env).filter(k => k.includes('INNO')));

            console.log('INNOFULFILL: Logging in...');
            console.log('INNOFULFILL: Email:', this.email || '(empty)');
            console.log('INNOFULFILL: Password length:', this.password?.length || 0);
            console.log('INNOFULFILL: Base URL:', this.baseUrl);

            const response = await axios.post(
                `${this.baseUrl}/auth/login`,
                {
                    email: this.email,
                    password: this.password,
                    vendorType: 'SELLER',
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (response.data?.data?.accessToken) {
                const { accessToken, refreshToken, expiresIn } = response.data.data;

                // Parse expiresIn (e.g., "1d" → 24 hours)
                let expiresMs = 24 * 60 * 60 * 1000; // Default 24 hours
                if (expiresIn) {
                    const match = expiresIn.match(/^(\d+)([dhm])$/);
                    if (match) {
                        const value = parseInt(match[1]);
                        const unit = match[2];
                        if (unit === 'd') expiresMs = value * 24 * 60 * 60 * 1000;
                        else if (unit === 'h') expiresMs = value * 60 * 60 * 1000;
                        else if (unit === 'm') expiresMs = value * 60 * 1000;
                    }
                }

                // Cache with 10% buffer before expiry
                this.tokenCache = {
                    accessToken,
                    refreshToken: refreshToken || '',
                    expiresAt: Date.now() + expiresMs * 0.9,
                };

                console.log('INNOFULFILL: Login successful, token cached');
                return accessToken;
            }

            throw new Error('No access token in response');
        } catch (error: any) {
            console.error('INNOFULFILL: Login failed:', error.response?.data || error.message);
            throw new Error(`Innofulfill login failed: ${error.message}`);
        }
    }

    /**
     * Get valid token (from cache or login)
     */
    private async getToken(): Promise<string> {
        if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
            return this.tokenCache.accessToken;
        }
        return this.login();
    }

    /**
     * Get authenticated axios client
     */
    private async getClient(): Promise<AxiosInstance> {
        const token = await this.getToken();
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
    }

    /**
     * Format date for Innofulfill API (YYYY-MM-DD HH:MM:SS in IST)
     */
    private formatDate(date: Date = new Date()): string {
        // IST offset is +5:30
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);
        return istDate.toISOString().replace('T', ' ').substring(0, 19);
    }

    /**
     * Sanitize phone to 10 digits
     */
    private sanitizePhone(phone: string | undefined): string {
        if (!phone) return '9999999999';
        const digits = phone.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length === 12) {
            return digits.slice(2);
        }
        if (digits.startsWith('0') && digits.length === 11) {
            return digits.slice(1);
        }
        if (digits.length > 10) {
            return digits.slice(-10);
        }
        return digits.padStart(10, '9');
    }

    /**
     * Create a shipment
     */
    async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
        try {
            const client = await this.getClient();
            const now = this.formatDate();

            console.log('=== INNOFULFILL CREATE SHIPMENT ===');
            console.log('Request:', JSON.stringify(request, null, 2));

            // Build Innofulfill order payload
            const payload = [{
                orderId: String(request.orderNumber),
                orderDate: now,
                orderType: 'FORWARD',
                autoManifest: true,
                returnable: true,
                deliveryType: 'SURFACE',
                deliveryPromise: 'STANDARD',

                addresses: {
                    pickup: {
                        zip: String(request.pickupPincode || ''),
                        name: String(request.pickupName || 'Swiftora'),
                        phone: this.sanitizePhone(request.pickupPhone),
                        email: request.pickupEmail || '',
                        street: String(request.pickupAddress || ''),
                        city: String(request.pickupCity || ''),
                        state: String(request.pickupState || ''),
                        country: request.pickupCountry || 'India',
                        type: 'WAREHOUSE',
                    },
                    delivery: {
                        zip: String(request.shippingPincode || ''),
                        name: String(request.customerName || ''),
                        phone: this.sanitizePhone(request.customerPhone),
                        email: request.customerEmail || '',
                        street: String(request.shippingAddress || ''),
                        city: String(request.shippingCity || ''),
                        state: String(request.shippingState || ''),
                        country: request.shippingCountry || 'India',
                    },
                    billing: {
                        zip: String(request.shippingPincode || ''),
                        name: String(request.customerName || ''),
                        phone: this.sanitizePhone(request.customerPhone),
                        email: request.customerEmail || '',
                        street: String(request.shippingAddress || ''),
                        city: String(request.shippingCity || ''),
                        state: String(request.shippingState || ''),
                        country: request.shippingCountry || 'India',
                    },
                    return: {
                        zip: String(request.pickupPincode || ''),
                        name: String(request.pickupName || 'Swiftora'),
                        phone: this.sanitizePhone(request.pickupPhone),
                        email: request.pickupEmail || '',
                        street: String(request.pickupAddress || ''),
                        city: String(request.pickupCity || ''),
                        state: String(request.pickupState || ''),
                        country: request.pickupCountry || 'India',
                    },
                },

                shipments: [{
                    dimensions: {
                        length: Number(request.length) || 10,
                        width: Number(request.breadth) || 10,
                        height: Number(request.height) || 10,
                    },
                    physicalWeight: Math.round((request.weight || 0.5) * 1000), // kg to grams
                    items: [{
                        name: String(request.productName || 'Product'),
                        quantity: request.quantity || 1,
                        weight: Math.round((request.weight || 0.5) * 1000 / (request.quantity || 1)),
                        unitPrice: Number(request.productValue) || 0,
                        sku: String(request.orderNumber),
                    }],
                }],

                payment: {
                    finalAmount: Number(request.totalAmount || request.productValue || 0),
                    status: request.paymentMode === 'COD' ? 'COD' : 'PAID',
                    currency: 'INR',
                    breakdown: {
                        subtotal: Number(request.productValue || 0),
                    },
                },
            }];

            console.log('INNOFULFILL Payload:', JSON.stringify(payload, null, 2));

            const response = await client.post('/booking/order/', payload, {
                headers: { async: 'false' },
            });

            console.log('INNOFULFILL Response:', JSON.stringify(response.data, null, 2));

            // Handle response
            if (response.data?.data && response.data.data.length > 0) {
                const orderResult = response.data.data[0];
                return {
                    success: true,
                    awbNumber: orderResult.trackingId || orderResult.labelBarcodeNumber,
                    courierName: this.name,
                    rawResponse: response.data,
                };
            }

            // Check for errors
            if (response.data?.errors && response.data.errors.length > 0) {
                const error = response.data.errors[0];
                return {
                    success: false,
                    courierName: this.name,
                    error: error.errorMessage || 'Order creation failed',
                    rawResponse: response.data,
                };
            }

            return {
                success: false,
                courierName: this.name,
                error: 'Unknown response format',
                rawResponse: response.data,
            };
        } catch (error: any) {
            console.error('INNOFULFILL: Create shipment error:', error.response?.data || error.message);
            return {
                success: false,
                courierName: this.name,
                error: error.response?.data?.message || error.message || 'Failed to create shipment',
                rawResponse: error.response?.data,
            };
        }
    }

    /**
     * Track a shipment
     */
    async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
        try {
            const client = await this.getClient();
            const trackingId = request.awbNumber || request.orderNumber;

            if (!trackingId) {
                return {
                    success: false,
                    events: [],
                    error: 'Tracking ID is required',
                };
            }

            const response = await client.get(`/tracking/${trackingId}/statuses?type=customer`);

            if (Array.isArray(response.data) && response.data.length > 0) {
                const events: TrackingEvent[] = response.data.map((event: any) => ({
                    status: event.category || event.status,
                    statusCode: event.event,
                    location: event.location,
                    timestamp: new Date(),
                    remarks: event.subcategory || event.status,
                }));

                return {
                    success: true,
                    awbNumber: trackingId,
                    currentStatus: events[0]?.status || 'Unknown',
                    events,
                    rawResponse: response.data,
                };
            }

            return {
                success: true,
                awbNumber: trackingId,
                currentStatus: 'Unknown',
                events: [],
                rawResponse: response.data,
            };
        } catch (error: any) {
            console.error('INNOFULFILL: Track shipment error:', error.response?.data || error.message);
            return {
                success: false,
                events: [],
                error: error.response?.data?.message || error.message || 'Failed to track shipment',
                rawResponse: error.response?.data,
            };
        }
    }

    /**
     * Cancel a shipment (if supported)
     */
    async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
        // Innofulfill may not have a direct cancel endpoint
        console.warn('INNOFULFILL: Cancel shipment not implemented');
        return {
            success: false,
            error: 'Cancel shipment not supported by Innofulfill API',
        };
    }

    /**
     * Check serviceability for a pincode route
     */
    async checkServiceability(request: CheckServiceabilityRequest): Promise<CheckServiceabilityResponse> {
        try {
            // Note: This endpoint doesn't require auth based on the docs
            const response = await axios.post(
                `${this.baseUrl}/fulfillment/public/seller/order/check-ecomm-order-serviceability`,
                {
                    fromPincode: parseInt(request.pincode) || 0, // Using destination pincode
                    toPincode: parseInt(request.pincode) || 0,
                    isCodOrder: false,
                    deliveryMode: 'SURFACE',
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (response.data?.data?.serviceability !== undefined) {
                return {
                    success: true,
                    serviceable: response.data.data.serviceability === true,
                };
            }

            return {
                success: false,
                serviceable: false,
                error: 'Unknown response format',
            };
        } catch (error: any) {
            console.error('INNOFULFILL: Serviceability check error:', error.response?.data || error.message);
            return {
                success: false,
                serviceable: false,
                error: error.response?.data?.message || error.message || 'Failed to check serviceability',
            };
        }
    }

    /**
     * Check serviceability with origin and destination pincodes
     */
    async checkRouteServiceability(
        originPincode: string,
        destinationPincode: string,
        isCod: boolean = false,
        deliveryMode: 'SURFACE' | 'AIR' = 'SURFACE'
    ): Promise<{ serviceable: boolean; error?: string }> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/fulfillment/public/seller/order/check-ecomm-order-serviceability`,
                {
                    fromPincode: parseInt(originPincode) || 0,
                    toPincode: parseInt(destinationPincode) || 0,
                    isCodOrder: isCod,
                    deliveryMode: deliveryMode,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            return {
                serviceable: response.data?.data?.serviceability === true,
            };
        } catch (error: any) {
            console.error('INNOFULFILL: Route serviceability check error:', error.response?.data || error.message);
            return {
                serviceable: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    /**
     * Calculate shipping rate
     */
    async calculateRate(request: CalculateRateRequest): Promise<CalculateRateResponse> {
        try {
            const client = await this.getClient();

            const response = await client.post('/fulfillment/rate-card/calculate-rate/ecomm', {
                deliveryPromise: 'STANDARD',
                fromPincode: parseInt(request.originPincode) || 0,
                toPincode: parseInt(request.destinationPincode) || 0,
                weight: Math.round(request.weight * 1000), // kg to grams
            });

            if (response.data?.data?.shippingCharge !== undefined) {
                return {
                    success: true,
                    rate: response.data.data.shippingCharge,
                    currency: 'INR',
                };
            }

            return {
                success: false,
                error: 'Unable to calculate rate',
            };
        } catch (error: any) {
            console.error('INNOFULFILL: Rate calculation error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to calculate rate',
            };
        }
    }

    /**
     * Calculate detailed shipping rate with dimensions
     */
    async calculateDetailedRate(
        originPincode: string,
        destinationPincode: string,
        weight: number, // in grams
        length?: number,
        width?: number,
        height?: number
    ): Promise<{
        success: boolean;
        shippingCharge?: number;
        appliedZone?: string;
        fuelCharges?: number;
        error?: string;
    }> {
        try {
            const client = await this.getClient();

            const payload: any = {
                deliveryPromise: 'STANDARD',
                fromPincode: parseInt(originPincode) || 0,
                toPincode: parseInt(destinationPincode) || 0,
                weight: weight,
            };

            if (length) payload.length = length;
            if (width) payload.width = width;
            if (height) payload.height = height;

            const response = await client.post('/fulfillment/rate-card/calculate-rate/ecomm', payload);

            if (response.data?.data) {
                return {
                    success: true,
                    shippingCharge: response.data.data.shippingCharge,
                    appliedZone: response.data.data.appliedZone?.MappingValue,
                    fuelCharges: response.data.data.fuelCharges || 0,
                };
            }

            return {
                success: false,
                error: 'Unable to calculate rate',
            };
        } catch (error: any) {
            console.error('INNOFULFILL: Detailed rate calculation error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }
}

// Singleton instance
export const innofulfillService = new InnofulfillService();
