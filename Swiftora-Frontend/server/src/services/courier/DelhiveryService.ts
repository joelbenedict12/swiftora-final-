/**
 * DELHIVERY COURIER SERVICE
 * 
 * Wraps the existing delhivery.ts functions into the ICourierService interface.
 * This allows Delhivery to be used interchangeably with other couriers.
 * 
 * Environment Variables Required:
 * - DELHIVERY_API_KEY
 * - DELHIVERY_BASE_URL (optional, defaults to production)
 */

import axios from 'axios';
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

const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';

export class DelhiveryService implements ICourierService {
  readonly name: CourierName = 'DELHIVERY';
  
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.DELHIVERY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('DELHIVERY_API_KEY not set in environment variables');
    }
  }
  
  /**
   * Get axios client with auth headers
   */
  private getClient() {
    return axios.create({
      baseURL: DELHIVERY_BASE_URL,
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  /**
   * Create shipment in Delhivery
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    console.log('=== DELHIVERY CREATE SHIPMENT ===');
    console.log('Order:', request.orderNumber);
    
    try {
      // Convert to Delhivery format
      // Weight should be in kg (Delhivery uses kg)
      const shipmentData = {
        pickup_location: request.pickupName,
        shipments: [{
          name: request.customerName,
          add: request.shippingAddress,
          pin: request.shippingPincode,
          city: request.shippingCity,
          state: request.shippingState,
          country: request.shippingCountry || 'India',
          phone: request.customerPhone,
          order: request.orderNumber,
          payment_mode: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
          return_pin: request.pickupPincode,
          return_city: request.pickupCity,
          return_phone: request.pickupPhone,
          return_add: request.pickupAddress,
          return_state: request.pickupState,
          return_country: request.pickupCountry || 'India',
          products_desc: request.productName,
          cod_amount: request.paymentMode === 'COD' ? (request.codAmount || request.totalAmount) : 0,
          total_amount: request.totalAmount,
          seller_name: request.pickupName,
          quantity: request.quantity,
          weight: request.weight, // kg
          shipment_length: request.length || 10,
          shipment_width: request.breadth || 10,
          shipment_height: request.height || 10,
          shipping_mode: 'Surface',
          address_type: 'home',
        }],
      };
      
      console.log('Delhivery payload:', JSON.stringify(shipmentData, null, 2));
      
      // Delhivery expects form-urlencoded with JSON data
      const body = `format=json&data=${JSON.stringify(shipmentData)}`;
      
      const response = await axios({
        method: 'post',
        url: `${DELHIVERY_BASE_URL}/api/cmu/create.json`,
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Accept': 'application/json',
        },
        data: body,
        transformRequest: [(data) => data],
      });
      
      console.log('Delhivery response:', JSON.stringify(response.data, null, 2));
      
      // Check for success
      if (response.data?.packages?.[0]?.waybill) {
        const pkg = response.data.packages[0];
        return {
          success: true,
          awbNumber: pkg.waybill,
          courierName: 'DELHIVERY',
          rawResponse: response.data,
        };
      } else {
        // Extract error message
        const errorMsg = response.data?.rmk ||
          response.data?.packages?.[0]?.remarks ||
          response.data?.packages?.[0]?.status ||
          response.data?.message ||
          'Failed to create shipment';
        
        return {
          success: false,
          courierName: 'DELHIVERY',
          error: errorMsg,
          rawResponse: response.data,
        };
      }
    } catch (error: any) {
      console.error('Delhivery createShipment error:', error.response?.data || error.message);
      return {
        success: false,
        courierName: 'DELHIVERY',
        error: error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }
  
  /**
   * Track shipment in Delhivery
   */
  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    console.log('=== DELHIVERY TRACK SHIPMENT ===');
    
    try {
      const client = this.getClient();
      const queryParams = new URLSearchParams();
      
      if (request.awbNumber) {
        queryParams.append('waybill', request.awbNumber);
      }
      if (request.orderNumber) {
        queryParams.append('ref_ids', request.orderNumber);
      }
      if (request.phone) {
        queryParams.append('phone', request.phone);
      }
      
      const response = await client.get(`/api/v1/packages/json/?${queryParams.toString()}`);
      
      console.log('Delhivery tracking response:', JSON.stringify(response.data, null, 2));
      
      // Parse tracking events
      const events: TrackingEvent[] = [];
      const shipmentData = response.data?.ShipmentData?.[0] || response.data?.[0];
      
      if (shipmentData?.Scans) {
        for (const scan of shipmentData.Scans) {
          events.push({
            status: scan.ScanDetail?.Scan || scan.Status,
            statusCode: scan.ScanDetail?.StatusCode,
            location: scan.ScanDetail?.ScannedLocation,
            timestamp: new Date(scan.ScanDetail?.ScanDateTime || scan.StatusDateTime),
            remarks: scan.ScanDetail?.Instructions,
          });
        }
      }
      
      return {
        success: true,
        awbNumber: shipmentData?.Shipment?.AWB || request.awbNumber,
        currentStatus: shipmentData?.Shipment?.Status?.Status,
        events,
        expectedDelivery: shipmentData?.Shipment?.ExpectedDeliveryDate 
          ? new Date(shipmentData.Shipment.ExpectedDeliveryDate) 
          : undefined,
        rawResponse: response.data,
      };
    } catch (error: any) {
      console.error('Delhivery trackShipment error:', error.response?.data || error.message);
      return {
        success: false,
        events: [],
        error: error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }
  
  /**
   * Cancel shipment in Delhivery
   * Note: Delhivery doesn't have a direct cancel API, shipments are cancelled via dashboard
   */
  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    console.log('=== DELHIVERY CANCEL SHIPMENT ===');
    
    // Delhivery typically requires contacting support or using dashboard
    // This is a placeholder - implement based on your Delhivery account capabilities
    return {
      success: false,
      error: 'Delhivery shipment cancellation requires manual intervention via dashboard',
    };
  }
  
  /**
   * Calculate shipping rate
   */
  async calculateRate(request: CalculateRateRequest): Promise<CalculateRateResponse> {
    console.log('=== DELHIVERY CALCULATE RATE ===');
    
    try {
      const client = this.getClient();
      
      const queryParams = new URLSearchParams({
        md: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
        ss: 'Delivered',
        d_pin: request.destinationPincode,
        o_pin: request.originPincode,
        cgm: (request.weight * 1000).toString(), // Convert kg to grams
      });
      
      if (request.paymentMode === 'COD' && request.codAmount) {
        queryParams.append('cod', request.codAmount.toString());
      }
      
      const response = await client.get(`/api/kinko/v1/invoice/charges/.json?${queryParams.toString()}`);
      
      console.log('Delhivery rate response:', JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        rate: response.data?.total_amount || response.data?.[0]?.total_amount,
        currency: 'INR',
        estimatedDays: response.data?.estimated_delivery_days,
      };
    } catch (error: any) {
      console.error('Delhivery calculateRate error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  
  /**
   * Check pincode serviceability
   */
  async checkServiceability(request: CheckServiceabilityRequest): Promise<CheckServiceabilityResponse> {
    console.log('=== DELHIVERY CHECK SERVICEABILITY ===');
    
    try {
      const client = this.getClient();
      
      const response = await client.get(`/c/api/pin-codes/json/?filter_codes=${request.pincode}`);
      
      console.log('Delhivery serviceability response:', JSON.stringify(response.data, null, 2));
      
      const delivery = response.data?.delivery_codes?.[0]?.postal_code;
      
      return {
        success: true,
        serviceable: !!delivery,
        city: delivery?.city,
        state: delivery?.state_code,
      };
    } catch (error: any) {
      console.error('Delhivery checkServiceability error:', error.response?.data || error.message);
      return {
        success: false,
        serviceable: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

// Export singleton instance
export const delhiveryService = new DelhiveryService();
