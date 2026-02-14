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

// Types for enhanced Delhivery features
export interface DelhiveryServiceOption {
  id: string;
  name: string;
  mode: 'Surface' | 'Express';
  freight_charges: number;
  cod_charges: number;
  total_charges: number;
  estimated_days?: number;
}

export interface DelhiveryPricingResponse {
  success: boolean;
  services: DelhiveryServiceOption[];
  error?: string;
}

export interface DelhiveryLabelResponse {
  success: boolean;
  labelUrl?: string;
  error?: string;
}

export interface DelhiveryPickupResponse {
  success: boolean;
  pickupId?: string;
  message?: string;
  error?: string;
}

export interface DelhiveryEditRequest {
  waybill: string;
  name?: string;
  phone?: string;
  address?: string;
  paymentMode?: 'COD' | 'Prepaid';
  codAmount?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

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
      // Convert to Delhivery format - ALL values must be strings or numbers, no undefined/null
      const shipmentData = {
        pickup_location: {
          name: String(request.pickupName || ''),
        },
        shipments: [{
          name: String(request.customerName || 'Customer'),
          add: String(request.shippingAddress || ''),
          pin: String(request.shippingPincode || ''),
          city: String(request.shippingCity || ''),
          state: String(request.shippingState || ''),
          country: String(request.shippingCountry || 'India'),
          phone: String(request.customerPhone || ''),
          order: String(request.orderNumber || ''),
          payment_mode: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
          return_pin: String(request.pickupPincode || ''),
          return_city: String(request.pickupCity || ''),
          return_phone: String(request.pickupPhone || ''),
          return_add: String(request.pickupAddress || ''),
          return_state: String(request.pickupState || ''),
          return_country: String(request.pickupCountry || 'India'),
          products_desc: String(request.productName || 'Product'),
          cod_amount: String(request.paymentMode === 'COD' ? (request.codAmount || request.totalAmount || 0) : 0),
          total_amount: String(request.totalAmount || 0),
          seller_name: String(request.pickupName || ''),
          quantity: String(request.quantity || 1),
          weight: String(request.weight || 0.5),
          shipment_length: String(request.length || 10),
          shipment_width: String(request.breadth || 10),
          shipment_height: String(request.height || 10),
          shipping_mode: String((request as any).shippingMode || 'Surface'),
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
   * Cancel shipment in Delhivery via /api/p/edit
   */
  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    console.log('=== DELHIVERY CANCEL SHIPMENT ===');

    try {
      const client = this.getClient();

      const response = await client.post('/api/p/edit', {
        waybill: request.awbNumber,
        cancellation: 'true',
      });

      console.log('Delhivery cancel response:', JSON.stringify(response.data, null, 2));

      // Delhivery can return status: true (boolean) or status: 'Success' (string)
      const ok =
        response.data?.status === 'Success' ||
        response.data?.status === true ||
        response.data?.success === true;
      // Also treat "already cancelled" as success so we can update our DB when user retries
      const remark = (response.data?.remark || response.data?.message || '').toString().toLowerCase();
      const alreadyCancelled = remark.includes('cancelled') && (remark.includes('already') || response.data?.status === true);

      if (ok || alreadyCancelled) {
        const msg = response.data?.remark || response.data?.message || 'Shipment cancelled successfully';
        return { success: true, message: msg };
      }

      return {
        success: false,
        error: response.data?.message || response.data?.error || 'Cancellation failed',
      };
    } catch (error: any) {
      console.error('Delhivery cancel error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Edit shipment details
   */
  async editShipment(request: DelhiveryEditRequest): Promise<{ success: boolean; error?: string }> {
    console.log('=== DELHIVERY EDIT SHIPMENT ===');

    try {
      const client = this.getClient();

      const payload: any = { waybill: request.waybill };
      if (request.name) payload.name = request.name;
      if (request.phone) payload.phone = request.phone;
      if (request.address) payload.add = request.address;
      if (request.paymentMode) payload.pt = request.paymentMode === 'COD' ? 'COD' : 'Pre-paid';
      if (request.codAmount !== undefined) payload.cod = request.codAmount;
      if (request.weight) payload.weight = request.weight;
      if (request.height) payload.shipment_height = request.height;
      if (request.width) payload.shipment_width = request.width;
      if (request.length) payload.shipment_length = request.length;

      const response = await client.post('/api/p/edit', payload);

      return {
        success: response.data?.status === 'Success' || !!response.data?.success,
        error: response.data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(waybill: string, pdfSize: 'A4' | '4R' = '4R'): Promise<DelhiveryLabelResponse> {
    console.log('=== DELHIVERY GENERATE LABEL ===');

    try {
      const client = this.getClient();

      const response = await client.get(`/api/p/packing_slip?wbns=${waybill}&pdf=true&pdf_size=${pdfSize}`);

      console.log('Delhivery label response:', JSON.stringify(response.data, null, 2));

      // Response contains array of packages with PDF URLs
      const pkg = response.data?.packages?.[0];
      if (pkg?.pdf_download_link) {
        return {
          success: true,
          labelUrl: pkg.pdf_download_link,
        };
      }

      return {
        success: false,
        error: 'No label URL in response',
      };
    } catch (error: any) {
      console.error('Delhivery label error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create pickup request
   */
  async createPickupRequest(params: {
    pickupLocation: string;
    pickupDate: string; // YYYY-MM-DD
    pickupTime: string; // HH:mm:ss
    expectedPackageCount: number;
  }): Promise<DelhiveryPickupResponse> {
    console.log('=== DELHIVERY CREATE PICKUP ===');

    try {
      const client = this.getClient();

      const response = await client.post('/fm/request/new/', {
        pickup_time: params.pickupTime,
        pickup_date: params.pickupDate,
        pickup_location: params.pickupLocation,
        expected_package_count: params.expectedPackageCount,
      });

      console.log('Delhivery pickup response:', JSON.stringify(response.data, null, 2));

      if (response.data?.pickup_id || response.data?.success) {
        return {
          success: true,
          pickupId: response.data.pickup_id,
          message: 'Pickup request created successfully',
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to create pickup request',
      };
    } catch (error: any) {
      console.error('Delhivery pickup error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get pricing with Surface/Express options
   */
  async getPricingWithOptions(params: {
    originPincode: string;
    destinationPincode: string;
    weight: number; // in grams
    paymentMode: 'COD' | 'Prepaid';
    codAmount?: number;
  }): Promise<DelhiveryPricingResponse> {
    console.log('=== DELHIVERY GET PRICING OPTIONS ===');

    try {
      const client = this.getClient();
      const services: DelhiveryServiceOption[] = [];

      // Get Surface rate
      const surfaceParams = new URLSearchParams({
        md: 'S', // Surface
        ss: 'Delivered',
        d_pin: params.destinationPincode,
        o_pin: params.originPincode,
        cgm: params.weight.toString(),
        pt: params.paymentMode === 'COD' ? 'COD' : 'Pre-paid',
      });

      if (params.codAmount && params.paymentMode === 'COD') {
        surfaceParams.append('cod', params.codAmount.toString());
      }

      try {
        const surfaceRes = await client.get(`/api/kinko/v1/invoice/charges/.json?${surfaceParams.toString()}`);
        if (surfaceRes.data) {
          const data = Array.isArray(surfaceRes.data) ? surfaceRes.data[0] : surfaceRes.data;
          services.push({
            id: 'surface',
            name: 'Surface (Standard)',
            mode: 'Surface',
            freight_charges: data.total_amount || data.freight_charge || 0,
            cod_charges: data.cod_charge || 0,
            total_charges: data.total_amount || (data.freight_charge + (data.cod_charge || 0)),
            estimated_days: data.estimated_delivery_days || 5,
          });
        }
      } catch (e) {
        console.log('Surface pricing not available');
      }

      // Get Express rate
      const expressParams = new URLSearchParams({
        md: 'E', // Express
        ss: 'Delivered',
        d_pin: params.destinationPincode,
        o_pin: params.originPincode,
        cgm: params.weight.toString(),
        pt: params.paymentMode === 'COD' ? 'COD' : 'Pre-paid',
      });

      if (params.codAmount && params.paymentMode === 'COD') {
        expressParams.append('cod', params.codAmount.toString());
      }

      try {
        const expressRes = await client.get(`/api/kinko/v1/invoice/charges/.json?${expressParams.toString()}`);
        if (expressRes.data) {
          const data = Array.isArray(expressRes.data) ? expressRes.data[0] : expressRes.data;
          services.push({
            id: 'express',
            name: 'Express (Fast)',
            mode: 'Express',
            freight_charges: data.total_amount || data.freight_charge || 0,
            cod_charges: data.cod_charge || 0,
            total_charges: data.total_amount || (data.freight_charge + (data.cod_charge || 0)),
            estimated_days: data.estimated_delivery_days || 2,
          });
        }
      } catch (e) {
        console.log('Express pricing not available');
      }

      return {
        success: services.length > 0,
        services,
        error: services.length === 0 ? 'No pricing available for this route' : undefined,
      };
    } catch (error: any) {
      console.error('Delhivery pricing error:', error.response?.data || error.message);
      return {
        success: false,
        services: [],
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Normalize pricing for UI
   */
  normalizePricingResponse(services: DelhiveryServiceOption[]): Array<{
    courier: 'DELHIVERY';
    service_id: string;
    service_name: string;
    freight: number;
    cod: number;
    total: number;
    estimated_days?: number;
  }> {
    return services.map(svc => ({
      courier: 'DELHIVERY' as const,
      service_id: svc.id,
      service_name: svc.name,
      freight: svc.freight_charges,
      cod: svc.cod_charges,
      total: svc.total_charges,
      estimated_days: svc.estimated_days,
    }));
  }

  /**
   * Calculate shipping rate (legacy method)
   */
  async calculateRate(request: CalculateRateRequest): Promise<CalculateRateResponse> {
    const result = await this.getPricingWithOptions({
      originPincode: request.originPincode,
      destinationPincode: request.destinationPincode,
      weight: Math.round(request.weight * 1000),
      paymentMode: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
      codAmount: request.codAmount,
    });

    if (!result.success || result.services.length === 0) {
      return { success: false, error: result.error };
    }

    // Return lowest rate
    const lowestRate = result.services.reduce((min, svc) =>
      svc.total_charges < min.total_charges ? svc : min
    );

    return {
      success: true,
      rate: lowestRate.total_charges,
      currency: 'INR',
      estimatedDays: lowestRate.estimated_days,
    };
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

