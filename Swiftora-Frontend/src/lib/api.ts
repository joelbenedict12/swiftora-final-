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

  update: (id: string, data: Partial<CreateOrderData>) =>
    api.put(`/orders/${id}`, data),

  cancel: (id: string) => api.post(`/orders/${id}/cancel`),

  walletCheck: () => api.get('/orders/wallet-check'),

  shippingEstimate: (orderId: string, courierName: string) =>
    api.post(`/orders/${orderId}/shipping-estimate`, { courierName }),

  // Generic ship method - pass courier name
  ship: (id: string, courierName: 'DELHIVERY' | 'BLITZ' | 'EKART' | 'XPRESSBEES' | 'INNOFULFILL', extra?: Record<string, any>) =>
    api.post(`/orders/${id}/ship`, { courierName, ...(extra || {}) }),

  // Convenience methods for each courier
  shipToDelhivery: (id: string, extra?: Record<string, any>) =>
    api.post(`/orders/${id}/ship`, { courierName: 'DELHIVERY', ...(extra || {}) }),

  shipToBlitz: (id: string, extra?: Record<string, any>) =>
    api.post(`/orders/${id}/ship`, { courierName: 'BLITZ', ...(extra || {}) }),

  shipToEkart: (id: string, preferredDispatchDate?: string, extra?: Record<string, any>) =>
    api.post(`/orders/${id}/ship`, { courierName: 'EKART', preferredDispatchDate, ...(extra || {}) }),

  shipToXpressbees: (id: string, extra?: Record<string, any>) =>
    api.post(`/orders/${id}/ship`, { courierName: 'XPRESSBEES', ...(extra || {}) }),

  shipToInnofulfill: (id: string, extra?: Record<string, any>) =>
    api.post(`/orders/${id}/ship`, { courierName: 'INNOFULFILL', ...(extra || {}) }),

  assignPickupLocation: (id: string, warehouseId: string) =>
    api.put(`/orders/${id}/pickup-location`, { warehouseId }),

  bulkImport: (orders: any[]) => api.post('/orders/bulk/import', { orders }),

  syncStatus: () => api.post('/orders/sync-status'),

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

  // Delhivery-specific APIs
  getDelhiveryPricing: (orderId: string) =>
    api.post(`/orders/${orderId}/delhivery/pricing`),

  selectDelhiveryService: (orderId: string, service: {
    service_id: string;
    service_name: string;
    freight: number;
    cod: number;
    total: number;
    estimated_days?: number;
  }) => api.post(`/orders/${orderId}/delhivery/select-service`, service),

  getDelhiveryLabel: (orderId: string, size?: '4R' | 'A4') =>
    api.get(`/orders/${orderId}/delhivery/label`, { params: { size } }),

  /** A4 shipping label PDF for any courier */
  getShippingLabelPdf: (orderId: string) =>
    api.get(`/orders/${orderId}/shipping-label`, { responseType: 'blob' }),

  createDelhiveryPickup: (params: {
    warehouseId: string;
    pickupDate: string;
    pickupTime?: string;
    expectedPackageCount: number;
  }) => api.post('/orders/delhivery/pickup', params),

  cancelDelhiveryShipment: (orderId: string) =>
    api.post(`/orders/${orderId}/delhivery/cancel`),
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
    courier: 'delhivery' | 'ekart' | 'xpressbees' | 'innofulfill';
    origin: string;
    destination: string;
    weight: number;
    paymentMode: 'prepaid' | 'cod';
    serviceType?: 'standard' | 'express' | 'priority';
    codAmount?: number;
  }) => {
    const { courier, ...rest } = params;

    let endpoint = '/integrations/delhivery/calculate-rate';
    if (courier === 'xpressbees') {
      endpoint = '/integrations/xpressbees/calculate-rate';
    } else if (courier === 'ekart') {
      endpoint = '/integrations/ekart/calculate-rate';
    } else if (courier === 'innofulfill') {
      endpoint = '/integrations/innofulfill/calculate-rate';
    }

    return api.get(endpoint, { params: rest });
  },

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

// Support API (for SUPPORT role users)
export const supportApi = {
  getDashboardStats: () => api.get('/support/dashboard-stats'),

  getTickets: (params?: {
    status?: string;
    priority?: string;
  }) => api.get('/support/tickets', { params }),

  getTicket: (id: string) => api.get(`/support/tickets/${id}`),

  updateTicket: (id: string, data: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    resolution?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) => api.put(`/support/tickets/${id}`, data),

  addNote: (ticketId: string, data: {
    content: string;
    isInternal?: boolean;
  }) => api.post(`/support/tickets/${ticketId}/notes`, data),

  getNotes: (ticketId: string) => api.get(`/support/tickets/${ticketId}/notes`),
};

// KYC (Didit) API — 60s for createSession (cold start + Didit can be slow). Must redeploy frontend for change to apply.
export const kycApi = {
  getStatus: () => api.get('/kyc', { timeout: 15000 }),
  createSession: () => api.post('/kyc/session', {}, { timeout: 60000 }),
};

// Billing / Wallet API (user-facing)
export const billingApi = {
  getWallet: () => api.get('/billing/wallet'),
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/billing/transactions', { params }),
  recharge: (amount: number) => api.post('/billing/recharge', { amount }),
  submitQrPayment: (data: { amount: number; utrReference: string }) =>
    api.post('/billing/qr-payment', data),
  getQrCode: () => api.get('/billing/qr-code'),
  checkPaymentStatus: (orderId: string) =>
    api.get(`/billing/payment-status/${orderId}`),
  getOutstanding: () => api.get('/billing/outstanding'),
  getInvoicesList: () => api.get('/billing/invoices'),
  downloadInvoice: (id: string) => api.get(`/billing/invoices/${id}/download`),
  payInvoice: (id: string) => api.post(`/billing/invoices/${id}/pay`),
  checkInvoicePaymentStatus: (id: string, orderId: string) =>
    api.get(`/billing/invoices/${id}/payment-status`, { params: { order_id: orderId } }),
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

  // P&L Analytics
  getAnalytics: (params?: { from?: string; to?: string }) =>
    api.get('/admin/analytics/profit', {
      params: params ? { startDate: params.from, endDate: params.to } : undefined,
    }),

  // Rate Cards
  getRateCards: (params?: { accountType?: string; courierName?: string }) =>
    api.get('/admin/rate-cards', { params }),
  createRateCard: (data: {
    accountType: string;
    courierName: string;
    marginType: string;
    marginValue: number;
    minWeight?: number;
    maxWeight?: number;
  }) => api.post('/admin/rate-cards', data),
  updateRateCard: (id: string, data: Record<string, any>) =>
    api.put(`/admin/rate-cards/${id}`, data),
  deleteRateCard: (id: string) => api.delete(`/admin/rate-cards/${id}`),
  calculateRate: (params: {
    origin_pin: string;
    destination_pin: string;
    weight: number;
    payment_mode: 'Prepaid' | 'COD';
    cod_amount?: number;
  }) => api.get('/admin/rate-cards/calculate', { params }),

  // Wallet
  getWalletBalance: (merchantId: string) =>
    api.get(`/admin/wallet/${merchantId}`),
  creditWallet: (data: { merchantId: string; amount: number; description?: string }) =>
    api.post('/admin/wallet/credit', data),
  getWalletTransactions: (merchantId: string) =>
    api.get(`/admin/wallet/${merchantId}/transactions`),
  verifyWalletBalance: (merchantId: string) =>
    api.get(`/admin/wallet/${merchantId}/verify`),

  // Invoices
  getInvoices: (params?: { merchantId?: string; status?: string }) =>
    api.get('/admin/invoices', { params }),
  generateInvoice: (data: { merchantId: string; month: number; year: number }) =>
    api.post('/admin/invoices/generate', data),
  updateInvoiceStatus: (id: string, data: { status: string }) =>
    api.patch(`/admin/invoices/${id}`, data),

  // Platform Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: {
    platform_commission_percent?: number;
    min_recharge_amount?: number;
    platform_qr_url?: string;
  }) => api.put('/admin/settings', data),

  // Vendor Pause
  toggleVendorPause: (merchantId: string, isPaused: boolean) =>
    api.put(`/admin/vendors/${merchantId}/pause`, { isPaused }),

  // Customer Type
  updateCustomerType: (merchantId: string, data: { customerType: 'CASH' | 'CREDIT'; creditLimit?: number }) =>
    api.put(`/admin/vendors/${merchantId}/customer-type`, data),

  // Monthly Billing
  generateMonthlyInvoices: (month?: string) =>
    api.post('/admin/billing/generate-invoices', { month }),
  getMonthlyInvoices: (params?: { merchantId?: string; isPaid?: string }) =>
    api.get('/admin/billing/invoices', { params }),
  markInvoicePaid: (id: string) =>
    api.put(`/admin/billing/invoices/${id}/mark-paid`),

  // Pending QR Payments
  getPendingPayments: () => api.get('/admin/pending-payments'),
  approvePayment: (transactionId: string) =>
    api.post(`/admin/pending-payments/${transactionId}/approve`),
  rejectPayment: (transactionId: string) =>
    api.post(`/admin/pending-payments/${transactionId}/reject`),

  // Enhanced Dashboard
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getCourierDistribution: () => api.get('/admin/courier-distribution'),
  getTopCustomers: () => api.get('/admin/top-customers'),
  getVendorAnalytics: (merchantId: string) =>
    api.get(`/admin/vendors/${merchantId}/analytics`),

  // Admin Orders
  getAdminOrders: (params?: Record<string, any>) =>
    api.get('/admin/orders', { params }),

  // User role management
  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),

  // Ticket assignment
  getSupportUsers: () => api.get('/admin/support-users'),
  assignTicket: (ticketId: string, assignedTo: string | null) =>
    api.put(`/admin/tickets/${ticketId}/assign`, { assignedTo }),
};

// ============================================================
// SHOPIFY API
// ============================================================

export const shopifyApi = {
  getStatus: () => api.get('/shopify/status'),
  connect: (shop: string) => api.get('/shopify/connect', { params: { shop } }),
  disconnect: () => api.post('/shopify/disconnect'),
  syncOrders: () => api.post('/shopify/sync'),
  updateSettings: (data: { autoFulfill: boolean }) => api.put('/shopify/settings', data),
};

// ============================================================
// COD REMITTANCE API
// ============================================================

export const codRemittanceApi = {
  // Vendor endpoints
  stats: () => api.get('/cod-remittance/stats'),
  list: (params?: { status?: string; courier?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/cod-remittance/list', { params }),

  // Admin endpoints
  adminStats: () => api.get('/cod-remittance/admin/stats'),
  adminList: (params?: { status?: string; courier?: string; merchantId?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/cod-remittance/admin/list', { params }),
  markReceived: (id: string, data: { courierCharges: number; platformFee: number }) =>
    api.put(`/cod-remittance/admin/${id}/receive`, data),
  markPaid: (id: string, data: { transactionId?: string; remittanceRef?: string }) =>
    api.put(`/cod-remittance/admin/${id}/pay`, data),
};

// ============================================================
// NDR (Non-Delivery Report) API
// ============================================================

export const ndrApi = {
  // Vendor
  stats: () => api.get('/ndr/stats'),
  list: (params?: { courier?: string; resolved?: string; page?: number; limit?: number }) =>
    api.get('/ndr', { params }),
  detail: (orderId: string) => api.get(`/ndr/${orderId}`),
  action: (orderId: string, data: { action: string; payload?: Record<string, any> }) =>
    api.post(`/ndr/${orderId}/action`, data),

  // Admin
  adminStats: () => api.get('/ndr/admin/stats'),
};
