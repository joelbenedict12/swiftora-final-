/**
 * COURIER SERVICE TYPES
 * 
 * Common interfaces for all courier integrations.
 * Following Interface Segregation Principle (ISP) from SOLID.
 */

// Supported courier names
export type CourierName = 'DELHIVERY' | 'BLITZ' | 'EKART' | 'XPRESSBEES' | 'INNOFULFILL';

// Standardized shipment request (courier-agnostic)
export interface CreateShipmentRequest {
  // Order details
  orderNumber: string;

  // Customer/Delivery details
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingAddress2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingCountry?: string;

  // Pickup/Warehouse details
  pickupName: string;
  pickupPhone: string;
  pickupEmail?: string;
  pickupAddress: string;
  pickupAddress2?: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  pickupCountry?: string;

  // Product details
  productName: string;
  productDescription?: string;
  productValue: number;
  quantity: number;

  // Package dimensions
  weight: number; // in kg (will be converted as needed)
  length?: number; // in cm
  breadth?: number; // in cm
  height?: number; // in cm

  // Payment
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
  totalAmount: number;

  // Optional metadata
  channelId?: string;
  sellerName?: string;
  brandName?: string;

  // Ekart-specific: preferred pickup date (YYYY-MM-DD)
  preferredDispatchDate?: string;

  // Service selection (optional, used by some couriers)
  serviceId?: string;       // e.g. Xpressbees courier/service id
  shippingMode?: string;    // e.g. 'Surface' | 'Express' for Delhivery
  deliveryPromise?: string; // e.g. 'SURFACE' | 'AIR' for Innofulfill
}

// Standardized shipment response
export interface CreateShipmentResponse {
  success: boolean;
  awbNumber?: string;
  courierName: CourierName;
  labelUrl?: string;
  trackingUrl?: string;
  error?: string;
  rawResponse?: any;
}

// Tracking request
export interface TrackShipmentRequest {
  awbNumber?: string;
  orderNumber?: string;
  phone?: string;
}

// Standardized tracking event
export interface TrackingEvent {
  status: string;
  statusCode?: string;
  location?: string;
  timestamp: Date;
  remarks?: string;
}

// Tracking response
export interface TrackShipmentResponse {
  success: boolean;
  awbNumber?: string;
  currentStatus?: string;
  events: TrackingEvent[];
  expectedDelivery?: Date;
  error?: string;
  rawResponse?: any;
}

// Cancel shipment request
export interface CancelShipmentRequest {
  awbNumber?: string;
  orderNumber?: string;
}

// Cancel shipment response
export interface CancelShipmentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Rate calculation request
export interface CalculateRateRequest {
  originPincode: string;
  destinationPincode: string;
  weight: number;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
}

// Rate calculation response
export interface CalculateRateResponse {
  success: boolean;
  rate?: number;
  currency?: string;
  estimatedDays?: number;
  error?: string;
}

// Serviceability check
export interface CheckServiceabilityRequest {
  pincode: string;
}

export interface CheckServiceabilityResponse {
  success: boolean;
  serviceable: boolean;
  city?: string;
  state?: string;
  error?: string;
  /** Ekart (and others) may return */
  cod?: boolean;
  maxCodAmount?: number;
  forwardPickup?: boolean;
  forwardDrop?: boolean;
}

/**
 * COURIER SERVICE INTERFACE
 * 
 * All courier implementations must implement this interface.
 * Following Liskov Substitution Principle (LSP) - any courier can be swapped.
 */
export interface ICourierService {
  readonly name: CourierName;

  // Core shipment operations
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse>;
  cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse>;

  // Optional operations (not all couriers support these)
  calculateRate?(request: CalculateRateRequest): Promise<CalculateRateResponse>;
  checkServiceability?(request: CheckServiceabilityRequest): Promise<CheckServiceabilityResponse>;
}
