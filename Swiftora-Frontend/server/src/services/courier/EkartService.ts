/**
 * EKART COURIER SERVICE
 * 
 * Integration with Ekart Logistics (Flipkart's logistics arm) via GoSwift API.
 * 
 * API Documentation: https://app.goswift.in
 * 
 * Key Points:
 * - Token-based auth (JWT) that expires in 24 hours
 * - Weight in grams, dimensions in centimeters
 * - payment_mode: COD, Prepaid, or Pickup (for reverse)
 * 
 * Environment Variables Required:
 * - EKART_CLIENT_ID
 * - EKART_USERNAME
 * - EKART_PASSWORD
 * - EKART_BASE_URL (optional, defaults to https://app.goswift.in)
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
} from './types.js';

// Ekart API URL
const EKART_BASE_URL = process.env.EKART_BASE_URL || 'https://app.elite.ekartlogistics.in';

// Token cache
interface TokenCache {
  accessToken: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp
}

let tokenCache: TokenCache | null = null;

export class EkartService implements ICourierService {
  readonly name: CourierName = 'EKART';

  private clientId: string;
  private username: string;
  private password: string;

  constructor() {
    // Trim and strip surrounding quotes from env vars (common Render copy-paste issue)
    this.clientId = (process.env.EKART_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
    this.username = (process.env.EKART_USERNAME || '').trim().replace(/^["']|["']$/g, '');
    this.password = (process.env.EKART_PASSWORD || '').trim().replace(/^["']|["']$/g, '');

    if (!this.clientId || !this.username || !this.password) {
      console.warn('EKART credentials not fully configured. Required: EKART_CLIENT_ID, EKART_USERNAME, EKART_PASSWORD');
    } else {
      console.log(`EKART credentials loaded — clientId: ${this.clientId} (len=${this.clientId.length}), username: ${this.username}`);
    }
  }

  /**
   * Authenticate with Ekart API and get JWT token
   * Tokens expire after 24 hours
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid cached token (with 5 min buffer)
    if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
      return tokenCache.accessToken;
    }

    console.log('=== EKART AUTHENTICATION ===');
    console.log('Auth URL:', `${EKART_BASE_URL}/integrations/v2/auth/token/${this.clientId}`);
    console.log('Username:', this.username);
    console.log('Password length:', this.password.length);
    console.log('Client ID length:', this.clientId.length);

    try {
      const response = await axios.post(
        `${EKART_BASE_URL}/integrations/v2/auth/token/${this.clientId}`,
        {
          username: this.username,
          password: this.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.access_token) {
        throw new Error('Ekart auth failed: No access_token in response');
      }

      // Cache the token
      tokenCache = {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'Bearer',
        expiresAt: Date.now() + (response.data.expires_in * 1000) - (60 * 60 * 1000), // 1 hour buffer
      };

      console.log('Ekart authentication successful');
      return tokenCache.accessToken;
    } catch (error: any) {
      console.error('Ekart authentication error:', error.response?.data || error.message);
      console.error('Ekart auth status:', error.response?.status);
      tokenCache = null; // Clear cache on failure
      throw new Error(`Ekart authentication failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get authenticated axios client
   */
  private async getClient(): Promise<AxiosInstance> {
    const token = await this.authenticate();

    return axios.create({
      baseURL: EKART_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Cache of registered address aliases (to avoid duplicate registration calls)
  private registeredAliases: Set<string> = new Set();

  /**
   * Register a pickup/return address with Ekart via Address API
   * POST /api/v2/address
   */
  private async ensureAddressRegistered(client: AxiosInstance, address: {
    alias: string;
    phone: number;
    address_line1: string;
    address_line2?: string | null;
    pincode: number;
    city: string;
    state: string;
    country: string;
  }): Promise<void> {
    if (this.registeredAliases.has(address.alias)) {
      console.log(`Address alias "${address.alias}" already registered (cached), skipping`);
      return;
    }

    console.log(`Registering address with Ekart: alias="${address.alias}"`);

    try {
      const response = await client.post('/api/v2/address', {
        alias: address.alias,
        phone: address.phone,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || undefined,
        pincode: address.pincode,
        city: address.city,
        state: address.state,
        country: address.country,
      });

      console.log('Ekart address registration response:', JSON.stringify(response.data));

      if (response.data.status === true) {
        this.registeredAliases.add(address.alias);
        console.log(`Address "${address.alias}" registered successfully`);
      } else {
        console.warn(`Address registration returned status false: ${response.data.remark}`);
        // Still continue — the address might already exist
        this.registeredAliases.add(address.alias);
      }
    } catch (error: any) {
      // If address already exists, that's fine — cache it and continue
      const errMsg = error.response?.data?.message || error.response?.data?.remark || error.message;
      console.warn(`Address registration warning (will continue): ${errMsg}`);
      this.registeredAliases.add(address.alias);
    }
  }

  /**
   * Create shipment in Ekart
   * Endpoint: PUT /api/v1/package/create
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    console.log('=== EKART CREATE SHIPMENT ===');
    console.log('Order:', request.orderNumber);

    // Check if credentials are configured
    if (!this.clientId || !this.username || !this.password) {
      return {
        success: false,
        courierName: 'EKART',
        error: 'Ekart credentials not configured. Please add EKART_CLIENT_ID, EKART_USERNAME, EKART_PASSWORD in environment variables.',
      };
    }

    try {
      const client = await this.getClient();

      // Register pickup address with Ekart if not already registered
      const pickupAlias = request.pickupName || 'Default Warehouse';
      await this.ensureAddressRegistered(client, {
        alias: pickupAlias,
        phone: parseInt(request.pickupPhone.replace(/\D/g, '').slice(-10)),
        address_line1: request.pickupAddress,
        address_line2: request.pickupAddress2 || null,
        pincode: parseInt(request.pickupPincode),
        city: request.pickupCity,
        state: request.pickupState,
        country: 'India',
      });

      // Convert weight from kg to grams
      const weightInGrams = Math.round(request.weight * 1000);

      // Dimensions in cm (Ekart uses cm)
      const lengthInCm = request.length ? Math.round(request.length) : 10;
      const heightInCm = request.height ? Math.round(request.height) : 10;
      const widthInCm = request.breadth ? Math.round(request.breadth) : 10;

      // Determine payment mode and amounts
      const paymentMode = request.paymentMode === 'COD' ? 'COD' : 'Prepaid';
      const totalAmount = request.totalAmount || request.productValue;
      const taxValue = Math.round(totalAmount * 0.18); // Assuming 18% GST
      const taxableAmount = totalAmount - taxValue;
      const codAmount = paymentMode === 'COD' ? (request.codAmount || totalAmount) : 0;

      // Build Ekart payload per API docs
      const payload = {
        // Seller details
        seller_name: request.sellerName || request.pickupName,
        seller_address: request.pickupAddress,
        seller_gst_tin: '29AABCU9603R1ZM', // Default GST (should be from merchant settings)
        consignee_gst_amount: 0,

        // Order details
        order_number: request.orderNumber,
        invoice_number: `INV-${request.orderNumber}`,
        invoice_date: new Date().toISOString().split('T')[0],

        // Consignee details
        consignee_name: request.customerName,
        consignee_alternate_phone: (() => {
          const custPhone = request.customerPhone.replace(/\D/g, '').slice(-10);
          const sellerPhone = request.pickupPhone ? request.pickupPhone.replace(/\D/g, '').slice(-10) : '';
          // Must be different from drop_location phone (customer phone)
          if (sellerPhone && sellerPhone !== custPhone) return sellerPhone;
          // If same or missing, flip last digit to make it different
          const lastDigit = parseInt(custPhone.slice(-1));
          return custPhone.slice(0, -1) + ((lastDigit + 1) % 10).toString();
        })(),
        products_desc: request.productName,

        // Payment
        payment_mode: paymentMode,
        category_of_goods: 'General',
        total_amount: totalAmount,
        tax_value: taxValue,
        taxable_amount: taxableAmount,
        commodity_value: taxableAmount.toString(),
        cod_amount: codAmount,

        // Package details
        quantity: request.quantity,
        weight: weightInGrams,
        length: lengthInCm,
        height: heightInCm,
        width: widthInCm,

        // Return reason (empty for forward shipments)
        return_reason: '',

        // Drop location (customer address)
        drop_location: {
          location_type: 'Home',
          address: request.shippingAddress + (request.shippingAddress2 ? ', ' + request.shippingAddress2 : ''),
          city: request.shippingCity,
          state: request.shippingState,
          country: request.shippingCountry || 'India',
          name: request.customerName,
          phone: parseInt(request.customerPhone.replace(/\D/g, '').slice(-10)),
          pin: parseInt(request.shippingPincode),
        },

        // Pickup location — use alias (address registered above)
        pickup_location: {
          name: pickupAlias,
        },

        // Return location — same alias as pickup
        return_location: {
          name: pickupAlias,
        },
      };

      console.log('Ekart payload:', JSON.stringify(payload, null, 2));

      // Ekart uses PUT for create
      const response = await client.put('/api/v1/package/create', payload);

      console.log('Ekart response:', JSON.stringify(response.data, null, 2));

      if (response.data.status === true && response.data.tracking_id) {
        return {
          success: true,
          awbNumber: response.data.tracking_id,
          courierName: 'EKART',
          trackingUrl: `https://app.elite.ekartlogistics.in/track/${response.data.tracking_id}`,
          rawResponse: response.data,
        };
      } else {
        return {
          success: false,
          courierName: 'EKART',
          error: response.data.remark || 'Failed to create shipment',
          rawResponse: response.data,
        };
      }
    } catch (error: any) {
      console.error('Ekart createShipment error:', error.response?.data || error.message);
      return {
        success: false,
        courierName: 'EKART',
        error: error.response?.data?.remark || error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }

  /**
   * Track shipment in Ekart
   * Endpoint: GET /api/v1/track/{id}
   */
  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    console.log('=== EKART TRACK SHIPMENT ===');

    if (!this.clientId || !this.username || !this.password) {
      return {
        success: false,
        events: [],
        error: 'Ekart credentials not configured',
      };
    }

    try {
      const client = await this.getClient();

      const trackingId = request.awbNumber || request.orderNumber;
      if (!trackingId) {
        throw new Error('Either awbNumber or orderNumber is required');
      }

      const response = await client.get(`/api/v1/track/${trackingId}`);

      console.log('Ekart tracking response:', JSON.stringify(response.data, null, 2));

      // Parse tracking events from response
      const events: TrackingEvent[] = [];

      // Main track object
      if (response.data.track) {
        const track = response.data.track;
        events.push({
          status: track.status,
          location: track.location || '',
          timestamp: new Date(track.ctime),
          remarks: track.desc,
        });

        // Additional details array
        if (track.details && Array.isArray(track.details)) {
          for (const detail of track.details) {
            events.push({
              status: detail.status || detail.activity,
              statusCode: detail.status_code,
              location: detail.location || detail.city,
              timestamp: new Date(detail.ctime || detail.timestamp),
              remarks: detail.desc || detail.description,
            });
          }
        }
      }

      return {
        success: true,
        awbNumber: response.data._id || trackingId,
        currentStatus: response.data.track?.status,
        events,
        expectedDelivery: response.data.edd ? new Date(response.data.edd) : undefined,
        rawResponse: response.data,
      };
    } catch (error: any) {
      console.error('Ekart trackShipment error:', error.response?.data || error.message);
      return {
        success: false,
        events: [],
        error: error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }

  /**
   * Cancel shipment in Ekart
   * Endpoint: DELETE /api/v1/package/cancel?tracking_id={id}
   */
  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    console.log('=== EKART CANCEL SHIPMENT ===');

    if (!this.clientId || !this.username || !this.password) {
      return {
        success: false,
        error: 'Ekart credentials not configured',
      };
    }

    try {
      const client = await this.getClient();

      const trackingId = request.awbNumber || request.orderNumber;
      if (!trackingId) {
        throw new Error('Either awbNumber or orderNumber is required');
      }

      const response = await client.delete('/api/v1/package/cancel', {
        params: { tracking_id: trackingId },
      });

      console.log('Ekart cancel response:', JSON.stringify(response.data, null, 2));

      return {
        success: response.data.status === true,
        message: response.data.remark,
      };
    } catch (error: any) {
      console.error('Ekart cancelShipment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.remark || error.response?.data?.message || error.message,
      };
    }
  }
}

// Export singleton instance
export const ekartService = new EkartService();
