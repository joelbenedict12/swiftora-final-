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
            // Force fresh login for booking requests
            console.log('INNOFULFILL: Forcing fresh login for booking...');
            const token = await this.login();

            console.log('=== INNOFULFILL CREATE SHIPMENT ===');

            // Build Innofulfill Ecom Booking payload per official API spec
            const pickupPhone = this.sanitizePhone(request.pickupPhone);
            const customerPhone = this.sanitizePhone(request.customerPhone);
            const weightInGrams = Math.round((request.weight || 0.5) * 1000);
            const productValue = Number(request.productValue) || 100;
            const finalAmount = Number(request.totalAmount || request.productValue || 100);
            const quantity = request.quantity || 1;
            const itemPrice = productValue * quantity;

            // Determine payment type and status per API rules:
            // COD -> paymentStatus must be PENDING
            // ONLINE -> paymentStatus must be PAID
            const isCOD = request.paymentMode === 'COD';
            const paymentType = isCOD ? 'COD' : 'ONLINE';
            const paymentStatus = isCOD ? 'PENDING' : 'PAID';

            const payload = {
                // --- Order-level mandatory fields ---
                orderId: String(request.orderNumber),
                currency: 'INR',
                amount: finalAmount,
                weight: weightInGrams,
                paymentType: paymentType,
                paymentStatus: paymentStatus,

                // --- Dimensions (mandatory) ---
                length: Number(request.length) || 10,
                width: Number(request.breadth) || 10,
                height: Number(request.height) || 10,

                // --- Optional order-level fields ---
                orderSubtype: 'FORWARD',
                deliveryPromise: 'SURFACE',
                remarks: request.productDescription || 'Order from Swiftora',
                orderCreatedAt: new Date().toISOString(),
                subTotal: productValue * quantity,
                readyToPick: true,

                // --- Line Items (mandatory) ---
                lineItems: [{
                    name: String(request.productName || 'Product'),
                    weight: Math.round(weightInGrams / quantity),
                    unitPrice: productValue,
                    price: itemPrice,
                    quantity: quantity,
                    sku: String(request.orderNumber),
                }],

                // --- Shipping Address ---
                shippingAddress: {
                    name: String(request.customerName || 'Customer'),
                    phone: customerPhone,
                    email: request.customerEmail || '',
                    address1: String(request.shippingAddress || ''),
                    address2: '',
                    city: String(request.shippingCity || ''),
                    state: String(request.shippingState || ''),
                    country: 'India',
                    zip: String(request.shippingPincode || ''),
                },

                // --- Billing Address ---
                billingAddress: {
                    name: String(request.customerName || 'Customer'),
                    phone: customerPhone,
                    email: request.customerEmail || '',
                    address1: String(request.shippingAddress || ''),
                    address2: '',
                    city: String(request.shippingCity || ''),
                    state: String(request.shippingState || ''),
                    country: 'India',
                    zip: String(request.shippingPincode || ''),
                },

                // --- Pickup Address (enables auto-processing) ---
                pickupAddress: {
                    name: String(request.pickupName || 'Swiftora Warehouse'),
                    phone: pickupPhone,
                    email: request.pickupEmail || 'warehouse@swiftora.com',
                    address1: String(request.pickupAddress || '123 Warehouse Street'),
                    address2: '',
                    city: String(request.pickupCity || 'Mumbai'),
                    state: String(request.pickupState || 'Maharashtra'),
                    country: 'India',
                    zip: String(request.pickupPincode || '400001'),
                },

                // --- Return Address ---
                returnAddress: {
                    name: String(request.pickupName || 'Swiftora Warehouse'),
                    phone: pickupPhone,
                    email: request.pickupEmail || 'warehouse@swiftora.com',
                    address1: String(request.pickupAddress || '123 Warehouse Street'),
                    address2: '',
                    city: String(request.pickupCity || 'Mumbai'),
                    state: String(request.pickupState || 'Maharashtra'),
                    country: 'India',
                    zip: String(request.pickupPincode || '400001'),
                },
            };

            console.log('INNOFULFILL Payload:', JSON.stringify(payload, null, 2));

            // Correct Ecom Booking API endpoint
            const bookingUrl = `${this.baseUrl}/fulfillment/public/seller/order/ecomm/push-order`;
            console.log('INNOFULFILL: Booking URL:', bookingUrl);

            const response = await axios.post(
                bookingUrl,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            console.log('INNOFULFILL Response:', JSON.stringify(response.data, null, 2));

            // Handle successful response
            const resData = response.data?.data || response.data;

            // Extract AWB from various possible fields
            const awb = resData?.awbNumber
                || resData?.cAwbNumber
                || resData?.trackingId
                || resData?.labelBarcodeNumber
                || (Array.isArray(resData) && resData[0]?.awbNumber)
                || (Array.isArray(resData) && resData[0]?.cAwbNumber)
                || (Array.isArray(resData) && resData[0]?.trackingId);

            if (response.data?.status === 200 || response.data?.success || awb) {
                return {
                    success: true,
                    awbNumber: awb || '',
                    courierName: this.name,
                    rawResponse: response.data,
                };
            }

            // Check for errors in response
            const errMsg = response.data?.message
                || response.data?.errors?.[0]?.errorMessage
                || response.data?.error
                || 'Order creation failed';

            return {
                success: false,
                courierName: this.name,
                error: errMsg,
                rawResponse: response.data,
            };
        } catch (error: any) {
            console.error('INNOFULFILL: ======= ERROR DEBUG =======');
            console.error('INNOFULFILL: Error message:', error.message);
            console.error('INNOFULFILL: Error status:', error.response?.status);
            console.error('INNOFULFILL: Error response data:', JSON.stringify(error.response?.data, null, 2));
            console.error('INNOFULFILL: Request URL:', error.config?.url);
            console.error('INNOFULFILL: ======= END ERROR DEBUG =======');

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
            // Fresh login for tracking
            const token = await this.login();
            const trackingId = request.awbNumber || request.orderNumber;

            if (!trackingId) {
                return {
                    success: false,
                    events: [],
                    error: 'Tracking ID is required',
                };
            }

            // Correct Ecom Order Tracking endpoint
            const response = await axios.get(
                `${this.baseUrl}/fulfillment/public/seller/order/order-tracking/${trackingId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const orderData = response.data?.data;

            if (orderData) {
                // Parse orderStateInfo into tracking events
                const events: TrackingEvent[] = [];
                if (Array.isArray(orderData.orderStateInfo)) {
                    for (const state of orderData.orderStateInfo) {
                        events.push({
                            status: state.state || 'Unknown',
                            location: state.location || '',
                            timestamp: new Date(state.createdAt),
                            remarks: state.remarks || state.state || '',
                        });
                    }
                }

                return {
                    success: true,
                    awbNumber: orderData.awbNumber || orderData.cAwbNumber || trackingId,
                    currentStatus: orderData.orderStatus || 'Unknown',
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
