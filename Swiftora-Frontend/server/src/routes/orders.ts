import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { delhivery } from '../services/delhivery.js';
import axios from 'axios';
import {
  getCourierService,
  getAvailableCouriers,
  isCourierSupported,
  CourierName,
  CreateShipmentRequest,
  xpressbeesService,
  delhiveryService,
} from '../services/courier/index.js';
import { calculateVendorPrice } from '../services/PricingEngine.js';
import * as WalletService from '../services/WalletService.js';

const router = Router();

// ============================================================
// XPRESSBEES DEBUG TEST ENDPOINT (bypass auth middleware for testing)
// ============================================================
router.get('/test-xpressbees', async (req, res) => {
  try {
    const token = process.env.XPRESSBEES_TOKEN || '';
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

    console.log('=== XPRESSBEES DIRECT TEST ===');
    console.log('Token exists:', !!cleanToken);
    console.log('Token length:', cleanToken.length);
    console.log('Token preview:', cleanToken.substring(0, 30) + '...' + cleanToken.substring(cleanToken.length - 20));

    if (!cleanToken) {
      return res.status(400).json({
        error: 'XPRESSBEES_TOKEN env not set',
        envKeys: Object.keys(process.env).filter(k => k.includes('XPRESS'))
      });
    }

    // Make direct API call
    const response = await axios.post(
      'https://shipment.xpressbees.com/api/courier/serviceability',
      {
        origin: '560001',
        destination: '560001',
        payment_type: 'prepaid',
        order_amount: '500',
        weight: '500',
        length: '10',
        breadth: '10',
        height: '10'
      },
      {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('=== XPRESSBEES SUCCESS ===');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      tokenLength: cleanToken.length,
      xpressbeesResponse: response.data
    });
  } catch (error: any) {
    console.log('=== XPRESSBEES ERROR ===');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Message:', error.message);

    res.status(error.response?.status || 500).json({
      error: 'Xpressbees API call failed',
      status: error.response?.status,
      xpressbeesError: error.response?.data,
      message: error.message
    });
  }
});

router.use(authenticate);

// Valid courier names
const CourierNameEnum = z.enum(['DELHIVERY', 'BLITZ', 'EKART', 'XPRESSBEES']);

const CreateOrderSchema = z.object({
  // Customer
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().email().optional(),

  // Shipping
  shippingAddress: z.string(),
  shippingCity: z.string(),
  shippingState: z.string(),
  shippingPincode: z.string(),
  shippingLandmark: z.string().optional(),

  // Product
  productName: z.string(),
  productValue: z.number(),
  quantity: z.number().default(1),

  // Payment
  paymentMode: z.enum(['PREPAID', 'COD']),
  codAmount: z.number().optional(),

  // Dimensions
  weight: z.number(),
  length: z.number().optional(),
  breadth: z.number().optional(),
  height: z.number().optional(),

  // B2B
  isB2B: z.boolean().default(false),
  gstNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  deliveryType: z.string().optional(),
  slotDate: z.string().optional(),
  slotTime: z.string().optional(),

  // Metadata
  warehouseId: z.string(),
  channel: z.string().optional(),
  notes: z.string().optional(),

  // Courier selection - only used when shipping, not at creation
  courierName: CourierNameEnum.optional(),
});

// Get available couriers
router.get('/couriers', async (req: AuthRequest, res) => {
  const couriers = getAvailableCouriers();
  const courierInfo: Record<string, { displayName: string; description: string }> = {
    DELHIVERY: {
      displayName: 'Delhivery',
      description: 'Pan-India logistics with COD support',
    },
    BLITZ: {
      displayName: 'Blitz',
      description: 'Quick commerce & same-day delivery',
    },
    EKART: {
      displayName: 'Ekart',
      description: 'Flipkart logistics - reliable nationwide delivery',
    },
    XPRESSBEES: {
      displayName: 'Xpressbees',
      description: 'Multi-service options with Surface, Air, and Same Day',
    },
  };

  res.json({
    couriers: couriers.map(name => ({
      name,
      displayName: courierInfo[name]?.displayName || name,
      description: courierInfo[name]?.description || '',
    })),
  });
});

// List orders
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;

    // Handle users without merchantId
    if (!req.user?.merchantId) {
      return res.json({
        orders: [],
        pagination: {
          total: 0,
          page: 1,
          limit: parseInt(limit as string),
          totalPages: 0,
        },
      });
    }

    const where: any = {
      merchantId: req.user.merchantId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { awbNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerPhone: { contains: search as string } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          warehouse: {
            select: { name: true, pincode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId,
      },
      include: {
        warehouse: true,
        packages: true,
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Create order
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    console.log('=== CREATE ORDER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Validate input
    const data = CreateOrderSchema.parse(req.body);
    console.log('Validated data:', data);

    if (!req.user!.merchantId) {
      return res.status(400).json({ error: 'Merchant account required' });
    }

    // Generate order number
    const count = await prisma.order.count({
      where: { merchantId: req.user!.merchantId },
    });
    const orderNumber = `ORD${Date.now()}${count + 1}`;
    console.log('Generated order number:', orderNumber);

    // Calculate volumetric and chargeable weight
    let volumetricWeight = 0;
    if (data.length && data.breadth && data.height) {
      volumetricWeight = (data.length * data.breadth * data.height) / 5000;
    }
    const chargeableWeight = Math.max(data.weight, volumetricWeight);

    // Get or create warehouse: use provided ID, else existing default, else create one only if none exists
    let warehouse = data.warehouseId
      ? await prisma.warehouse.findFirst({
        where: {
          id: data.warehouseId,
          merchantId: req.user!.merchantId,
          isActive: true,
        },
      })
      : null;

    if (!warehouse) {
      // Reuse existing "Default Warehouse" for this merchant if any (avoid duplicates)
      warehouse = await prisma.warehouse.findFirst({
        where: {
          merchantId: req.user!.merchantId,
          name: 'Default Warehouse',
          isActive: true,
        },
      });
    }

    if (!warehouse) {
      // No warehouse at all: create a single default only once per merchant
      warehouse = await prisma.warehouse.create({
        data: {
          merchantId: req.user!.merchantId,
          name: 'Default Warehouse',
          address: '123 Default Address',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '+91-9876543210',
          email: 'warehouse@swiftora.com',
          isDefault: true,
        },
      });
    }

    // Create order in DB (no courier assigned yet — user picks from Orders page)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        merchantId: req.user!.merchantId,
        userId: req.user!.id,
        warehouseId: warehouse.id,

        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,

        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPincode: data.shippingPincode,
        shippingLandmark: data.shippingLandmark,

        productName: data.productName,
        productValue: data.productValue,
        quantity: data.quantity,

        paymentMode: data.paymentMode,
        codAmount: data.codAmount || 0,

        weight: data.weight,
        length: data.length,
        breadth: data.breadth,
        height: data.height,
        volumetricWeight,
        chargeableWeight,

        isB2B: data.isB2B,
        gstNumber: data.gstNumber,
        invoiceNumber: data.invoiceNumber,
        deliveryType: data.deliveryType,

        channel: data.channel,
        notes: data.notes,

        status: 'PENDING',
      },
    });
    console.log('Order created:', order.id);

    // Auto-create support ticket for the order
    try {
      const ticketCount = await prisma.ticket.count({
        where: { merchantId: req.user!.merchantId },
      });
      const ticketNumber = `TKT-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(3, '0')}`;

      // Calculate SLA due date (48 hours default)
      const dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + 48);

      await prisma.ticket.create({
        data: {
          ticketNumber,
          merchantId: req.user!.merchantId,
          userId: req.user!.id,
          orderId: order.id,
          type: 'OTHER',
          subject: `Order Created: ${orderNumber}`,
          description: `A new order ${orderNumber} has been created. Customer: ${data.customerName}, Product: ${data.productName}, Amount: ₹${data.productValue}`,
          priority: 'MEDIUM',
          status: 'OPEN',
          slaHours: 48,
          dueAt,
        },
      });
      console.log('Auto-created ticket for order:', orderNumber);
    } catch (ticketError: any) {
      console.error('Failed to auto-create ticket:', ticketError);
      // Don't fail the order creation if ticket creation fails
    }

    // Return order (no courier yet — user picks courier later from Orders page)
    return res.status(201).json({
      order,
    });
  } catch (error: any) {
    console.error('=== CREATE ORDER ERROR ===', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: error.message || 'Failed to create order',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
});

// Cancel order
router.post('/:id/cancel', async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!['PENDING', 'READY_TO_SHIP'].includes(order.status)) {
      throw new AppError(400, 'Cannot cancel order in current status');
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Bulk import orders
router.post('/bulk/import', async (req: AuthRequest, res, next) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new AppError(400, 'Invalid orders data');
    }

    // TODO: Implement bulk import with job queue
    // For now, return placeholder
    res.json({
      message: 'Bulk import started',
      jobId: `job_${Date.now()}`,
      total: orders.length,
    });
  } catch (error) {
    next(error);
  }
});

// Note: Orders are created locally, then shipments are created with the selected courier

// Ship order - creates shipment with selected courier and gets AWB
// Accepts optional courierName in body to override the order's default courier
router.post('/:id/ship', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Get courier from request body (optional, defaults to order's courierName or DELHIVERY)
    const { courierName: requestedCourier } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
      include: {
        warehouse: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.awbNumber) {
      throw new AppError(400, 'This order has already been shipped. AWB: ' + order.awbNumber);
    }

    if (!order.warehouse) {
      throw new AppError(400, 'No pickup location assigned to this order. Please create a pickup location in Settings first.');
    }

    const warehouse = order.warehouse;

    // Validate warehouse has complete data
    const missingFields: string[] = [];
    if (!warehouse.phone) missingFields.push('Phone Number');
    if (!warehouse.address) missingFields.push('Address');
    if (!warehouse.city) missingFields.push('City');
    if (!warehouse.state) missingFields.push('State');
    if (!warehouse.pincode) missingFields.push('Pincode');

    if (missingFields.length > 0) {
      throw new AppError(400,
        `Your pickup location "${warehouse.name}" is missing required information: ${missingFields.join(', ')}. ` +
        'Please update your pickup location in Settings → Pickup Locations.'
      );
    }

    // Determine which courier to use
    // Priority: 1) Request body, 2) Order's stored courierName, 3) Default to DELHIVERY
    let selectedCourier: CourierName = 'DELHIVERY';

    if (requestedCourier && isCourierSupported(requestedCourier)) {
      selectedCourier = requestedCourier as CourierName;
    } else if (order.courierName && isCourierSupported(order.courierName)) {
      selectedCourier = order.courierName as CourierName;
    }

    console.log(`Shipping order ${order.orderNumber} with courier: ${selectedCourier}`);

    // Get the courier service
    const courierService = getCourierService(selectedCourier);

    // Build standardized shipment request
    const shipmentRequest: CreateShipmentRequest = {
      orderNumber: order.orderNumber,

      // Customer details
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || undefined,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      shippingCountry: 'India',

      // Pickup/Warehouse details
      pickupName: warehouse.delhiveryName || warehouse.name,
      pickupPhone: warehouse.phone,
      pickupEmail: warehouse.email || undefined,
      pickupAddress: warehouse.address,
      pickupCity: warehouse.city,
      pickupState: warehouse.state,
      pickupPincode: warehouse.pincode,
      pickupCountry: 'India',

      // Product details
      productName: order.productName,
      productDescription: order.productName,
      productValue: Number(order.productValue),
      quantity: order.quantity,

      // Package dimensions
      weight: Number(order.chargeableWeight) || Number(order.weight) || 0.5,
      length: order.length ? Number(order.length) : undefined,
      breadth: order.breadth ? Number(order.breadth) : undefined,
      height: order.height ? Number(order.height) : undefined,

      // Payment
      paymentMode: order.paymentMode as 'PREPAID' | 'COD',
      codAmount: order.codAmount ? Number(order.codAmount) : undefined,
      totalAmount: Number(order.productValue),

      // Optional metadata
      channelId: order.channel || undefined,
    };

    console.log(`${selectedCourier} shipment request:`, JSON.stringify(shipmentRequest, null, 2));

    // Create shipment using the courier service
    const shipmentResponse = await courierService.createShipment(shipmentRequest);
    console.log(`${selectedCourier} response:`, JSON.stringify(shipmentResponse, null, 2));

    // Check for success
    if (shipmentResponse.success && shipmentResponse.awbNumber) {
      // --- PRICING ENGINE: calculate vendor charge ---
      // Get user account type for rate card lookup
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { accountType: true },
      });
      const accountType = user?.accountType || 'B2C';

      // Calculate pricing (courierCost from courier response or use productValue as fallback)
      const courierCost = shipmentResponse.rawResponse?.freight
        || shipmentResponse.rawResponse?.total_charge
        || shipmentResponse.rawResponse?.total
        || 0;

      const pricing = await calculateVendorPrice({
        courierCost,
        userAccountType: accountType,
        courierName: selectedCourier,
        weight: Number(order.chargeableWeight) || Number(order.weight) || 0.5,
      });

      // --- WALLET: debit vendor wallet ---
      // TODO: PayU payment gateway integration will be added here
      // For now, deduct from internal wallet balance
      let walletResult = null;
      if (pricing.vendorCharge > 0) {
        walletResult = await WalletService.debit(
          req.user!.merchantId,
          pricing.vendorCharge,
          order.id,
          `Shipment charge for ${order.orderNumber} via ${selectedCourier}`
        );
        if (!walletResult.success) {
          console.warn(`Wallet debit failed for order ${order.orderNumber}: ${walletResult.error}`);
          // Don't block shipment — wallet debit is best-effort for now
          // When PayU is integrated, this will become a hard requirement
        }
      }

      // Update order with AWB + pricing data
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          awbNumber: shipmentResponse.awbNumber,
          courierName: shipmentResponse.courierName,
          labelUrl: shipmentResponse.labelUrl,
          status: 'READY_TO_SHIP',
          courierCost: pricing.courierCost,
          vendorCharge: pricing.vendorCharge,
          margin: pricing.margin,
        },
      });

      return res.json({
        success: true,
        awbNumber: shipmentResponse.awbNumber,
        courierName: shipmentResponse.courierName,
        labelUrl: shipmentResponse.labelUrl,
        pricing: {
          courierCost: pricing.courierCost,
          vendorCharge: pricing.vendorCharge,
          margin: pricing.margin,
        },
        wallet: walletResult ? {
          debited: walletResult.success,
          balanceAfter: walletResult.balanceAfter,
        } : null,
        order: updated,
      });
    } else {
      // Handle courier error
      console.error(`${selectedCourier} shipment failed:`, shipmentResponse.error);
      throw new AppError(400, `${selectedCourier} Error: ${shipmentResponse.error || 'Failed to create shipment'}`);
    }
  } catch (error: any) {
    console.error('=== SHIP ORDER ERROR ===');
    console.error('Error:', error.message);

    if (error instanceof AppError) {
      next(error);
    } else {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create shipment';
      return res.status(500).json({
        success: false,
        error: errorMsg,
        debug: error.response?.data || error.message,
      });
    }
  }
});

// Assign pickup location to an order
router.put('/:id/pickup-location', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const { warehouseId } = req.body;
    if (!warehouseId) {
      throw new AppError(400, 'Pickup location ID is required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.awbNumber) {
      throw new AppError(400, 'Cannot change pickup location for shipped orders');
    }

    // Verify warehouse belongs to merchant
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        merchantId: req.user.merchantId,
        isActive: true,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Pickup location not found');
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { warehouseId: warehouse.id },
      include: { warehouse: true },
    });

    res.json({
      success: true,
      message: `Pickup location set to "${warehouse.name}"`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// XPRESSBEES-SPECIFIC ROUTES
// ==============================================================

// Get Xpressbees pricing/service options for an order
router.post('/:id/xpressbees/pricing', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
      include: {
        warehouse: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!order.warehouse) {
      throw new AppError(400, 'No pickup location assigned to this order');
    }

    // Calculate weight in grams
    const weightInGrams = Math.round(Number(order.chargeableWeight || order.weight || 0.5) * 1000);

    // Call Xpressbees serviceability API
    const pricingResult = await xpressbeesService.checkServiceabilityWithPricing({
      origin: order.warehouse.pincode,
      destination: order.shippingPincode,
      payment_type: order.paymentMode === 'COD' ? 'cod' : 'prepaid',
      order_amount: Number(order.productValue) || 0,
      weight: weightInGrams,
      length: Number(order.length) || 10,
      breadth: Number(order.breadth) || 10,
      height: Number(order.height) || 10,
    });

    if (!pricingResult.success) {
      return res.status(400).json({
        success: false,
        error: pricingResult.error || 'Could not fetch Xpressbees pricing',
      });
    }

    // Normalize the response to platform format
    const normalizedServices = xpressbeesService.normalizePricingResponse(pricingResult.services);

    res.json({
      success: true,
      services: normalizedServices,
      raw: pricingResult.services,
    });
  } catch (error) {
    next(error);
  }
});

// Select Xpressbees service for an order
router.post('/:id/xpressbees/select-service', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const { service_id, service_name, freight, cod, total, chargeable_weight } = req.body;

    if (!service_id) {
      throw new AppError(400, 'Service ID is required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Update order with selected courier and pricing info
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        courierName: 'XPRESSBEES',
        notes: `Xpressbees Service: ${service_name} | Freight: ₹${freight} | COD: ₹${cod} | Total: ₹${total} | Weight: ${chargeable_weight}g`,
      },
    });

    res.json({
      success: true,
      message: `Selected ${service_name} for order`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Get NDR list for Xpressbees
router.get('/xpressbees/ndr', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const ndrResult = await xpressbeesService.getNdrList();

    res.json({
      success: ndrResult.success,
      items: ndrResult.items,
      error: ndrResult.error,
    });
  } catch (error) {
    next(error);
  }
});

// Create NDR action for Xpressbees
router.post('/xpressbees/ndr/action', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const { actions } = req.body;

    if (!Array.isArray(actions) || actions.length === 0) {
      throw new AppError(400, 'Actions array is required');
    }

    const result = await xpressbeesService.createNdrAction(actions);

    res.json({
      success: result.success,
      results: result.results,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// DELHIVERY-SPECIFIC ROUTES
// ==============================================================

// Get Delhivery pricing options (Surface/Express)
router.post('/:id/delhivery/pricing', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
      include: {
        warehouse: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!order.warehouse) {
      throw new AppError(400, 'No pickup location assigned to this order');
    }

    // Calculate weight in grams
    const weightInGrams = Math.round(Number(order.chargeableWeight || order.weight || 0.5) * 1000);

    const pricingResult = await delhiveryService.getPricingWithOptions({
      originPincode: order.warehouse.pincode,
      destinationPincode: order.shippingPincode,
      paymentMode: order.paymentMode === 'COD' ? 'COD' : 'Prepaid',
      weight: weightInGrams,
      codAmount: order.paymentMode === 'COD' ? Number(order.codAmount) || 0 : undefined,
    });

    if (!pricingResult.success) {
      return res.status(400).json({
        success: false,
        error: pricingResult.error || 'Could not fetch Delhivery pricing',
      });
    }

    const normalizedServices = delhiveryService.normalizePricingResponse(pricingResult.services);

    res.json({
      success: true,
      services: normalizedServices,
      raw: pricingResult.services,
    });
  } catch (error) {
    next(error);
  }
});

// Select Delhivery service for an order
router.post('/:id/delhivery/select-service', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const { service_id, service_name, freight, cod, total, estimated_days } = req.body;

    if (!service_id) {
      throw new AppError(400, 'Service ID is required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        courierName: 'DELHIVERY',
        notes: `Delhivery ${service_name} | Freight: ₹${freight} | COD: ₹${cod} | Total: ₹${total} | Est: ${estimated_days} days`,
      },
    });

    res.json({
      success: true,
      message: `Selected ${service_name} for order`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Get shipping label for Delhivery order
router.get('/:id/delhivery/label', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!order.awbNumber) {
      throw new AppError(400, 'Order has no AWB number');
    }

    const pdfSize = (req.query.size as '4R' | 'A4') || '4R';
    const labelResult = await delhiveryService.generateLabel(order.awbNumber, pdfSize);

    if (!labelResult.success) {
      return res.status(400).json({
        success: false,
        error: labelResult.error || 'Could not generate label',
      });
    }

    res.json({
      success: true,
      labelUrl: labelResult.labelUrl,
    });
  } catch (error) {
    next(error);
  }
});

// Create pickup request for Delhivery
router.post('/delhivery/pickup', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const { warehouseId, pickupDate, pickupTime, expectedPackageCount } = req.body;

    if (!warehouseId || !pickupDate || !expectedPackageCount) {
      throw new AppError(400, 'warehouseId, pickupDate, and expectedPackageCount are required');
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        merchantId: req.user.merchantId,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    const pickupResult = await delhiveryService.createPickupRequest({
      pickupLocation: warehouse.name,
      pickupDate,
      pickupTime: pickupTime || '11:00:00',
      expectedPackageCount,
    });

    res.json({
      success: pickupResult.success,
      pickupId: pickupResult.pickupId,
      message: pickupResult.message,
      error: pickupResult.error,
    });
  } catch (error) {
    next(error);
  }
});

// Cancel Delhivery shipment
router.post('/:id/delhivery/cancel', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!order.awbNumber) {
      throw new AppError(400, 'Order has no AWB number to cancel');
    }

    const cancelResult = await delhiveryService.cancelShipment({
      awbNumber: order.awbNumber,
      orderNumber: order.orderNumber,
    });

    if (cancelResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
    }

    res.json({
      success: cancelResult.success,
      message: cancelResult.message,
      error: cancelResult.error,
    });
  } catch (error) {
    next(error);
  }
});

export const ordersRouter = router;

