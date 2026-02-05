import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://swiftora-final.onrender.com/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enable sending cookies with CORS requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Get token from Zustand store
  // We need to import it dynamically to avoid circular dependencies
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth storage on 401
      localStorage.removeItem('auth-storage');

      // Dynamically import to avoid circular dependency
      const { useAuth } = await import('./auth');
      useAuth.getState().logout();

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    phone: string;
    name: string;
    password: string;
    companyName?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: () => api.post('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Orders API
export interface CreateOrderData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingLandmark?: string;
  productName: string;
  productValue: number;
  quantity?: number;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
  weight: number;
  length?: number;
  breadth?: number;
  height?: number;
  isB2B?: boolean;
  gstNumber?: string;
  invoiceNumber?: string;
  deliveryType?: string;
  slotDate?: string;
  slotTime?: string;
  warehouseId: string;
  channel?: string;
  notes?: string;
}

export const ordersApi = {
  list: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/orders', { params }),

  get: (id: string) => api.get(`/orders/${id}`),

  create: (data: CreateOrderData) => api.post('/orders', data),

  cancel: (id: string) => api.post(`/orders/${id}/cancel`),

  // Generic ship method - pass courier name
  ship: (id: string, courierName: 'DELHIVERY' | 'BLITZ' | 'EKART' | 'XPRESSBEES') =>
    api.post(`/orders/${id}/ship`, { courierName }),

  // Convenience methods for each courier
  shipToDelhivery: (id: string) => api.post(`/orders/${id}/ship`, { courierName: 'DELHIVERY' }),

  shipToBlitz: (id: string) => api.post(`/orders/${id}/ship`, { courierName: 'BLITZ' }),

  shipToEkart: (id: string) => api.post(`/orders/${id}/ship`, { courierName: 'EKART' }),

  shipToXpressbees: (id: string) => api.post(`/orders/${id}/ship`, { courierName: 'XPRESSBEES' }),

  assignPickupLocation: (id: string, warehouseId: string) =>
    api.put(`/orders/${id}/pickup-location`, { warehouseId }),

  bulkImport: (orders: any[]) => api.post('/orders/bulk/import', { orders }),

  // Get available couriers
  getCouriers: () => api.get('/orders/couriers'),

  // Xpressbees-specific APIs
  getXpressbeesPricing: (orderId: string) =>
    api.post(`/orders/${orderId}/xpressbees/pricing`),

  selectXpressbeesService: (orderId: string, service: {
    service_id: string;
    service_name: string;
    freight: number;
    cod: number;
    total: number;
    chargeable_weight?: number;
  }) => api.post(`/orders/${orderId}/xpressbees/select-service`, service),

  // NDR APIs
  getXpressbeesNdr: () => api.get('/orders/xpressbees/ndr'),

  createXpressbeesNdrAction: (actions: Array<{
    type: 'RE_ATTEMPT' | 'CHANGE_ADDRESS' | 'CHANGE_PHONE';
    awbNumber: string;
    reAttemptDate?: string;
    newName?: string;
    newAddress1?: string;
    newAddress2?: string;
    newPhone?: string;
  }>) => api.post('/orders/xpressbees/ndr/action', { actions }),
};

// Pickups API
export interface CreatePickupData {
  warehouseId: string;
  scheduledDate: string;
  scheduledTime?: string;
  timeSlot?: string;
  courierName?: string;
  orderCount?: number;
  notes?: string;
}

export const pickupsApi = {
  list: (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
  }) => api.get('/pickups', { params }),

  get: (id: string) => api.get(`/pickups/${id}`),

  create: (data: CreatePickupData) => api.post('/pickups', data),

  cancel: (id: string) => api.post(`/pickups/${id}/cancel`),
};

// Tracking API
export const trackingApi = {
  track: (params: { awb?: string; orderId?: string; phone?: string }) =>
    api.get('/tracking/track', { params }),

  trackOrder: (orderNumber: string) =>
    api.get(`/tracking/orders/${orderNumber}`),
};

// Serviceability API
export const serviceabilityApi = {
  check: (pincode: string) => api.get(`/serviceability/check/${pincode}`),

  bulkCheck: (pincodes: string[]) =>
    api.post('/serviceability/check/bulk', { pincodes }),
};

// Rates API
export const ratesApi = {
  calculate: (data: {
    originPincode: string;
    destinationPincode: string;
    weight: number;
    paymentMode: 'PREPAID' | 'COD';
    codAmount?: number;
  }) => api.post('/rates/calculate', data),
};

// Dashboard API
export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),

  analytics: (params?: { period?: '7d' | '30d' | '90d' }) =>
    api.get('/dashboard/analytics', { params }),
};

// Warehouse API
export const warehousesApi = {
  list: () => api.get('/warehouses'),
  get: (id: string) => api.get(`/warehouses/${id}`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: string, data: any) => api.put(`/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
  setupJsEnterprisesWarehouse: () => api.post('/warehouses/setup-js-enterprises'),
  syncFromDelhivery: () => api.get('/sync-delhivery-warehouses'),
  syncToDelhivery: (id: string) => api.post(`/warehouses/${id}/sync-to-delhivery`),
  linkDelhivery: (id: string, delhiveryName: string) =>
    api.post(`/warehouses/${id}/link-delhivery`, { delhiveryName }),
  cleanupDefaultDuplicates: () => api.post('/warehouses/cleanup-default-duplicates'),
};

// Integrations API
export const integrationsApi = {
  // Delhivery
  connectDelhivery: (data: { apiKey: string; clientId?: string }) =>
    api.post('/integrations/delhivery/connect', data),

  disconnectDelhivery: () =>
    api.post('/integrations/delhivery/disconnect'),

  getDelhiveryStatus: () =>
    api.get('/test-delhivery'), // Uses the working test-delhivery endpoint

  testDelhivery: () =>
    api.get('/integrations/delhivery/test'),

  checkPincodeServiceability: (origin: string, destination: string) =>
    api.get('/integrations/delhivery/pincode-serviceability', {
      params: { origin, destination }
    }),

  calculateRate: (params: {
    origin: string;
    destination: string;
    weight: number;
    paymentMode: 'prepaid' | 'cod';
    serviceType?: 'standard' | 'express' | 'priority';
    codAmount?: number;
  }) => api.get('/integrations/delhivery/calculate-rate', { params }),

  // Note: Delhivery doesn't support order syncing
  // Orders are created locally, shipments created in Delhivery

  getAllOrders: (params?: {
    page?: number;
    limit?: number;
    source?: 'swiftora' | 'delhivery' | 'all';
  }) => api.get('/integrations/orders/all', { params }),
};

// Tickets API
export const ticketsApi = {
  list: (params?: {
    status?: string;
    priority?: string;
    type?: string;
  }) => api.get('/tickets', { params }),

  get: (id: string) => api.get(`/tickets/${id}`),

  create: (data: {
    type: 'DELIVERY_ISSUE' | 'WEIGHT_DISPUTE' | 'LOST_DAMAGED' | 'COURIER_ESCALATION' | 'BILLING_ISSUE' | 'PICKUP_ISSUE' | 'OTHER';
    subject: string;
    description: string;
    orderId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) => api.post('/tickets', data),

  update: (id: string, data: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    resolution?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) => api.put(`/tickets/${id}`, data),
};

// KYC (Didit) API — 60s for createSession (cold start + Didit can be slow). Must redeploy frontend for change to apply.
export const kycApi = {
  getStatus: () => api.get('/kyc', { timeout: 15000 }),
  createSession: () => api.post('/kyc/session', {}, { timeout: 60000 }),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getOrdersChart: () => api.get('/admin/orders-chart'),
  getRevenueChart: () => api.get('/admin/revenue-chart'),
  getRecentOrders: () => api.get('/admin/recent-orders'),
  getUsers: () => api.get('/admin/users'),
  getVendors: () => api.get('/admin/vendors'),
  getTickets: (params?: {
    status?: string;
    priority?: string;
    type?: string;
  }) => api.get('/admin/tickets', { params }),
  updateTicket: (id: string, data: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    resolution?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) => api.put(`/admin/tickets/${id}`, data),
};
