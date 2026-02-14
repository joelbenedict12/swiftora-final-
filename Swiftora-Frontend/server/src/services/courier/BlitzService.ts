/**
 * BLITZ COURIER SERVICE
 * 
 * Integration with Blitz (blitznow.in) logistics API.
 * 
 * Key differences from Delhivery:
 * - Token-based auth (JWT) that expires in 24 hours
 * - Weight in grams, dimensions in millimeters
 * - collectableAmount > 0 = COD, = 0 = PREPAID
 * 
 * Environment Variables Required:
 * - BLITZ_USERNAME
 * - BLITZ_PASSWORD
 * - BLITZ_CHANNEL_ID (optional, defaults to 'SWIFTORA')
 * - BLITZ_BASE_URL (optional, defaults to production)
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

// Blitz API URLs
const BLITZ_AUTH_URL = process.env.BLITZ_AUTH_URL || 'https://oyvm2iv4xj.execute-api.ap-south-1.amazonaws.com';
const BLITZ_SHIPMENT_URL = process.env.BLITZ_SHIPMENT_URL || 'https://xv24xrhpxa.execute-api.ap-south-1.amazonaws.com';

// Token cache (simple in-memory, consider Redis for production)
interface TokenCache {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

let tokenCache: TokenCache | null = null;

export class BlitzService implements ICourierService {
  readonly name: CourierName = 'BLITZ';

  private username: string;
  private password: string;
  private channelId: string;

  constructor() {
    this.username = process.env.BLITZ_USERNAME || '';
    this.password = process.env.BLITZ_PASSWORD || '';
    this.channelId = process.env.BLITZ_CHANNEL_ID || 'SWIFTORA';

    if (!this.username || !this.password) {
      console.warn('BLITZ_USERNAME or BLITZ_PASSWORD not set in environment variables');
    }
  }

  /**
   * Authenticate with Blitz API and get JWT token
   * Tokens expire after 24 hours
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid cached token (with 5 min buffer)
    if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
      return tokenCache.idToken;
    }

    console.log('=== BLITZ AUTHENTICATION ===');
    console.log('Authenticating with username:', this.username);

    try {
      const response = await axios.post(
        `${BLITZ_AUTH_URL}/v1/auth`,
        {
          request_type: 'authenticate',
          payload: {
            username: this.username,
            password: this.password,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Blitz auth failed: ${response.data.message || 'Unknown error'}`);
      }

      // Cache the token (24 hour expiry)
      tokenCache = {
        idToken: response.data.id_token,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23 hours (1 hour buffer)
      };

      console.log('Blitz authentication successful');
      return tokenCache.idToken;
    } catch (error: any) {
      console.error('Blitz authentication error:', error.response?.data || error.message);
      throw new Error(`Blitz authentication failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get authenticated axios client
   */
  private async getClient(): Promise<AxiosInstance> {
    const token = await this.authenticate();

    return axios.create({
      baseURL: BLITZ_SHIPMENT_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });
  }

  /**
   * Create shipment in Blitz
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    console.log('=== BLITZ CREATE SHIPMENT ===');
    console.log('Order:', request.orderNumber);

    try {
      const client = await this.getClient();

      // Convert weight from kg to grams
      const weightInGrams = Math.round(request.weight * 1000);

      // Convert dimensions from cm to mm
      const lengthInMm = request.length ? Math.round(request.length * 10) : 100;
      const breadthInMm = request.breadth ? Math.round(request.breadth * 10) : 100;
      const heightInMm = request.height ? Math.round(request.height * 10) : 100;

      // Determine payment mode and collectable amount
      // Blitz: collectableAmount > 0 = COD, = 0 = PREPAID
      const collectableAmount = request.paymentMode === 'COD'
        ? (request.codAmount || request.totalAmount)
        : 0;

      const payload = {
        channelId: this.channelId,
        returnShipmentFlag: 'false',
        Shipment: {
          code: request.orderNumber,
          orderCode: request.orderNumber,
          weight: weightInGrams.toString(),
          length: lengthInMm.toString(),
          height: heightInMm.toString(),
          breadth: breadthInMm.toString(),
          items: [
            {
              name: request.productName,
              description: request.productDescription || request.productName,
              quantity: request.quantity.toString(),
              item_value: request.productValue.toString(),
              skuCode: '',
            },
          ],
        },
        deliveryAddressDetails: {
          name: request.customerName,
          phone: request.customerPhone,
          email: request.customerEmail || '',
          address1: request.shippingAddress,
          address2: request.shippingAddress2 || '',
          pincode: request.shippingPincode,
          city: request.shippingCity,
          state: request.shippingState,
          country: request.shippingCountry || 'India',
        },
        pickupAddressDetails: {
          name: request.pickupName,
          phone: request.pickupPhone,
          email: request.pickupEmail || '',
          address1: request.pickupAddress,
          address2: request.pickupAddress2 || '',
          pincode: request.pickupPincode,
          city: request.pickupCity,
          state: request.pickupState,
          country: request.pickupCountry || 'India',
          seller_name: request.sellerName || '',
          brand_name: request.brandName || '',
        },
        paymentMode: request.paymentMode,
        totalAmount: request.totalAmount.toString(),
        collectableAmount: collectableAmount.toString(),
      };

      console.log('Blitz payload:', JSON.stringify(payload, null, 2));

      const response = await client.post('/v1/waybill/', payload);

      console.log('Blitz response status:', response.status);
      console.log('Blitz response data:', JSON.stringify(response.data, null, 2));

      // Extract waybill from response - check multiple possible fields
      const waybill = response.data.waybill || response.data.awb || response.data.trackingId || response.data.shipmentId;

      if (response.data.status === 'SUCCESS' && waybill) {
        return {
          success: true,
          awbNumber: waybill,
          courierName: 'BLITZ',
          labelUrl: response.data.shippingLabel,
          rawResponse: response.data,
        };
      } else if (waybill) {
        // Blitz created the order but returned a non-SUCCESS status (e.g. serviceability warning)
        // Still capture the AWB since the order exists on their dashboard
        console.warn(`Blitz returned non-SUCCESS but has waybill: ${waybill}. Message: ${response.data.message}`);
        return {
          success: true,
          awbNumber: waybill,
          courierName: 'BLITZ',
          labelUrl: response.data.shippingLabel,
          rawResponse: response.data,
        };
      } else {
        return {
          success: false,
          courierName: 'BLITZ',
          error: response.data.message || 'Failed to create shipment',
          rawResponse: response.data,
        };
      }
    } catch (error: any) {
      console.error('Blitz createShipment error:', error.response?.data || error.message);
      console.error('Blitz error status:', error.response?.status);
      console.error('Blitz full error response:', JSON.stringify(error.response?.data));

      // Check if error response still contains a waybill (Blitz sometimes creates the order but returns 4xx)
      const errData = error.response?.data;
      const waybill = errData?.waybill || errData?.awb || errData?.trackingId || errData?.shipmentId;
      if (waybill) {
        console.warn(`Blitz returned error but has waybill: ${waybill}`);
        return {
          success: true,
          awbNumber: waybill,
          courierName: 'BLITZ',
          rawResponse: errData,
        };
      }

      return {
        success: false,
        courierName: 'BLITZ',
        error: error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }

  /**
 * Track shipment in Blitz
 * POST https://oyvm2iv4xj.execute-api.ap-south-1.amazonaws.com/v1/tracking
 */
  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    console.log('=== BLITZ TRACK SHIPMENT ===');

    try {
      const client = await this.getClient();

      const payload: any = {};

      if (request.awbNumber) {
        payload.field = 'shipment';
        payload.value = request.awbNumber;
      } else if (request.orderNumber) {
        payload.field = 'channel_order_id';
        payload.value = request.orderNumber;
      } else {
        throw new Error('Either awbNumber or orderNumber is required');
      }

      // Blitz tracking endpoint
      const response = await axios.post(
        'https://oyvm2iv4xj.execute-api.ap-south-1.amazonaws.com/v1/tracking',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': await this.authenticate(),
          },
        }
      );

      console.log('Blitz tracking response:', JSON.stringify(response.data, null, 2));

      const data = response.data;
      if (!data?.isSuccess || !data?.result?.length) {
        throw new Error(data?.message || 'Shipment not found on Blitz');
      }

      const shipmentResult = data.result[0];
      const trackingEvents = shipmentResult.tracking || [];

      // Parse tracking events from response
      const events: TrackingEvent[] = trackingEvents.map((scan: any) => ({
        status: scan.shipmentStatus || 'Update',
        statusCode: scan.tab || '',
        location: scan.location || '',
        timestamp: new Date(scan.timestamp),
        remarks: scan.remarks || scan.gsRemark || '',
      }));

      return {
        success: true,
        awbNumber: shipmentResult.awb || request.awbNumber,
        currentStatus: trackingEvents[0]?.shipmentStatus || 'Unknown',
        events,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('Blitz trackShipment error:', error.response?.data || error.message);
      return {
        success: false,
        events: [],
        error: error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }

  /**
   * Cancel shipment in Blitz
   */
  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    console.log('=== BLITZ CANCEL SHIPMENT ===');

    try {
      const client = await this.getClient();

      const payload: any = {};

      if (request.awbNumber) {
        payload.field = 'waybill';
        payload.value = request.awbNumber;
      } else if (request.orderNumber) {
        payload.field = 'channel_order_id';
        payload.value = request.orderNumber;
      } else {
        throw new Error('Either awbNumber or orderNumber is required');
      }

      const response = await client.post('/v1/cancel', payload);

      console.log('Blitz cancel response:', JSON.stringify(response.data, null, 2));

      return {
        success: response.data.status === 'SUCCESS' || response.data.code === 200,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error('Blitz cancelShipment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

// Export singleton instance
export const blitzService = new BlitzService();
