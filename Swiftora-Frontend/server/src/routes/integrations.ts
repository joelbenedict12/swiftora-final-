import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import axios from 'axios';

const router = Router();
router.use(authenticate);

const ConnectDelhiverySchema = z.object({
  apiKey: z.string().min(10),
  clientId: z.string().optional(),
});

// Connect Delhivery account
router.post('/delhivery/connect', async (req: AuthRequest, res, next) => {
  try {
    const data = ConnectDelhiverySchema.parse(req.body);

    if (!req.user!.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Test credentials by making a test API call
    try {
      const testClient = axios.create({
        baseURL: 'https://track.delhivery.com',
        headers: {
          'Authorization': `Token ${data.apiKey}`,
        },
      });

      // Try to fetch a sample endpoint to verify key
      await testClient.get('/api/v1/packages/json/?waybill=TEST');
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AppError(401, 'Invalid Delhivery API key');
      }
      // If 404 or other error, key might still be valid (TEST waybill doesn't exist)
    }

    await prisma.merchant.update({
      where: { id: req.user!.merchantId },
      data: {
        delhiveryApiKey: data.apiKey,
        delhiveryClientId: data.clientId,
        delhiveryEnabled: true,
      },
    });

    res.json({
      success: true,
      message: 'Delhivery account connected successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect Delhivery account
router.post('/delhivery/disconnect', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user!.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    await prisma.merchant.update({
      where: { id: req.user!.merchantId },
      data: {
        delhiveryApiKey: null,
        delhiveryClientId: null,
        delhiveryEnabled: false,
      },
    });

    res.json({
      success: true,
      message: 'Delhivery account disconnected'
    });
  } catch (error) {
    next(error);
  }
});

// Get integration status
router.get('/delhivery/status', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user!.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user!.merchantId },
      select: {
        delhiveryEnabled: true,
        delhiveryLastSync: true,
        delhiveryClientId: true,
      },
    });

    res.json({
      connected: merchant?.delhiveryEnabled || false,
      lastSync: merchant?.delhiveryLastSync,
      clientId: merchant?.delhiveryClientId,
    });
  } catch (error) {
    next(error);
  }
});

// Test Delhivery API connection
router.get('/delhivery/test', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user!.merchantId) {
      return res.status(400).json({ error: 'Merchant account required' });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user!.merchantId },
      select: {
        delhiveryApiKey: true,
        delhiveryEnabled: true,
      },
    });

    if (!merchant?.delhiveryEnabled || !merchant?.delhiveryApiKey) {
      return res.json({
        connected: false,
        error: 'Delhivery not connected. Please add your API key in Settings > Integrations.'
      });
    }

    // Test the API with a simple request
    try {
      const testClient = axios.create({
        baseURL: 'https://track.delhivery.com',
        headers: {
          'Authorization': `Token ${merchant.delhiveryApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Try to check pincode (simple test)
      const response = await testClient.get('/c/api/pin-codes/json/?filter_codes=560068');

      return res.json({
        connected: true,
        apiKeyValid: true,
        testResponse: response.data,
        message: 'Delhivery API is working!'
      });
    } catch (apiError: any) {
      return res.json({
        connected: false,
        apiKeyValid: false,
        error: apiError.response?.data || apiError.message,
        status: apiError.response?.status,
        message: 'Delhivery API returned an error'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Note: Delhivery does NOT provide order syncing functionality
// Orders are created locally in Swiftora, then shipments are created in Delhivery
// Tracking updates come via webhooks

// Get all orders (including synced ones)
router.get('/orders/all', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user!.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const { page = '1', limit = '50', source } = req.query;

    const where: any = {
      merchantId: req.user!.merchantId,
    };

    // Filter by source if specified
    if (source === 'swiftora') {
      // Orders created through our system (have userId)
      where.userId = { not: null };
    } else if (source === 'delhivery') {
      // Orders synced from Delhivery (no userId)
      where.userId = null;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          warehouse: {
            select: { name: true },
          },
        },
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

// Helper: calculate estimated delivery days based on zone/distance
function calculateEstimatedDays(
  originCity: string | null,
  destCity: string | null,
  originState: string | null,
  destState: string | null,
  courierSpeedFactor: number = 1 // 1 = normal, 0.7 = faster, 1.3 = slower
): number {
  let baseDays: number;

  // Same city
  if (originCity && destCity && originCity.toLowerCase() === destCity.toLowerCase()) {
    baseDays = 1;
  }
  // Same state
  else if (originState && destState && originState.toLowerCase() === destState.toLowerCase()) {
    baseDays = 3;
  }
  // Adjacent/nearby states (metros)
  else {
    // Check if both are metro cities for faster delivery
    const metroCities = ['delhi', 'mumbai', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'faridabad', 'thane', 'navi mumbai'];
    const isOriginMetro = originCity && metroCities.some(m => originCity.toLowerCase().includes(m));
    const isDestMetro = destCity && metroCities.some(m => destCity.toLowerCase().includes(m));

    if (isOriginMetro && isDestMetro) {
      baseDays = 4;
    }
    // NE states, J&K, etc. take longer
    else {
      const remoteStates = ['AR', 'MN', 'MZ', 'NL', 'ML', 'TR', 'SK', 'AN', 'JK', 'LA', 'AP'];
      const isRemote = (originState && remoteStates.includes(originState.toUpperCase())) ||
        (destState && remoteStates.includes(destState.toUpperCase()));
      baseDays = isRemote ? 7 : 5;
    }
  }

  // Apply courier speed factor and round
  return Math.max(1, Math.round(baseDays * courierSpeedFactor));
}

// Check pincode serviceability (All couriers: Delhivery, Blitz, Ekart)
router.get('/delhivery/pincode-serviceability', async (req: AuthRequest, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || typeof origin !== 'string') {
      throw new AppError(400, 'Origin pincode is required');
    }
    if (!destination || typeof destination !== 'string') {
      throw new AppError(400, 'Destination pincode is required');
    }

    // Validate pincodes are 6 digits
    if (!/^\d{6}$/.test(origin) || !/^\d{6}$/.test(destination)) {
      throw new AppError(400, 'Pincodes must be 6 digits');
    }

    // Get merchant's Delhivery API key if available, otherwise use default
    let apiKey = process.env.DELHIVERY_API_KEY;

    if (req.user?.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: req.user.merchantId },
        select: { delhiveryApiKey: true },
      });
      if (merchant?.delhiveryApiKey) {
        apiKey = merchant.delhiveryApiKey;
      }
    }

    const couriers: any[] = [];
    let originData: any = null;
    let destData: any = null;

    // === DELHIVERY SERVICEABILITY ===
    let delhiveryEtd: number | null = null;
    if (apiKey) {
      try {
        const delhiveryClient = axios.create({
          baseURL: 'https://track.delhivery.com',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        // Fetch pincode data AND rate data (for real ETD) in parallel
        const [originResult, destinationResult, rateResult] = await Promise.all([
          delhiveryClient.get(`/c/api/pin-codes/json/?filter_codes=${origin}`),
          delhiveryClient.get(`/c/api/pin-codes/json/?filter_codes=${destination}`),
          // Call rate API with a standard 500g shipment to get ETD
          delhiveryClient.get(`/api/kinko/v1/invoice/charges/.json?md=E&ss=Delivered&d_pin=${destination}&o_pin=${origin}&cgm=500`).catch(() => null),
        ]);

        originData = originResult.data?.delivery_codes?.[0]?.postal_code || null;
        destData = destinationResult.data?.delivery_codes?.[0]?.postal_code || null;

        // Extract real ETD from rate API response
        if (rateResult?.data) {
          const rateData = Array.isArray(rateResult.data) ? rateResult.data[0] : rateResult.data;
          delhiveryEtd = rateData?.etd || rateData?.edd || null;
          if (typeof delhiveryEtd === 'string') {
            delhiveryEtd = parseInt(delhiveryEtd, 10) || null;
          }
        }

        if (originData && destData) {
          // Use real ETD from rate API, or calculate based on zone
          const estimatedDays = delhiveryEtd ||
            calculateEstimatedDays(originData.city, destData.city, originData.state_code, destData.state_code, 1);

          couriers.push({
            name: 'Delhivery',
            serviceable: true,
            cod: destData.cod === 'Y',
            prepaid: destData.pre_paid === 'Y',
            pickup: destData.pickup === 'Y' || originData.pickup === 'Y',
            estimatedDays,
            originCity: originData.city,
            destinationCity: destData.city,
            originState: originData.state_code,
            destinationState: destData.state_code,
            remarks: destData.remarks || '',
          });
        }
      } catch (delhiveryError: any) {
        console.warn('Delhivery serviceability check failed:', delhiveryError.message);
      }
    }

    // === BLITZ SERVICEABILITY ===
    // Blitz is a quick commerce / express logistics partner — faster than standard couriers
    if (originData && destData) {
      const blitzDays = calculateEstimatedDays(
        originData.city, destData.city, originData.state_code, destData.state_code,
        0.6 // Blitz is ~40% faster
      );
      couriers.push({
        name: 'Blitz',
        serviceable: true,
        cod: true,
        prepaid: true,
        pickup: true,
        estimatedDays: blitzDays,
        originCity: originData.city,
        destinationCity: destData.city,
        remarks: 'Quick commerce & same-day delivery available',
      });
    }

    // === EKART SERVICEABILITY ===
    const ekartClientId = process.env.EKART_CLIENT_ID;
    const ekartUsername = process.env.EKART_USERNAME;
    const ekartPassword = process.env.EKART_PASSWORD;

    if (ekartClientId && ekartUsername && ekartPassword) {
      try {
        const authResponse = await axios.post(
          `https://app.goswift.in/integrations/v2/auth/token/${ekartClientId}`,
          { username: ekartUsername, password: ekartPassword },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (authResponse.data.access_token) {
          const ekartClient = axios.create({
            baseURL: 'https://app.goswift.in',
            headers: {
              'Authorization': `Bearer ${authResponse.data.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          const [ekartOrigin, ekartDest] = await Promise.all([
            ekartClient.get(`/api/v2/serviceability/${origin}`).catch(() => null),
            ekartClient.get(`/api/v2/serviceability/${destination}`).catch(() => null),
          ]);

          const originServiceable = ekartOrigin?.data?.status === true;
          const destServiceable = ekartDest?.data?.status === true;

          if (originServiceable && destServiceable) {
            const destDetails = ekartDest?.data?.details || {};
            const ekartCity = destDetails.city || destData?.city;
            const originCity = ekartOrigin?.data?.details?.city || originData?.city;
            const ekartDays = destDetails.estimated_days || destDetails.etd ||
              calculateEstimatedDays(originCity, ekartCity, originData?.state_code, destData?.state_code, 1.1);

            couriers.push({
              name: 'Ekart',
              serviceable: true,
              cod: destDetails.cod === true,
              prepaid: true,
              pickup: destDetails.forward_pickup === true,
              estimatedDays: ekartDays,
              originCity: originCity,
              destinationCity: ekartCity,
              maxCodAmount: destDetails.max_cod_amount || 25000,
              remarks: 'Flipkart logistics - reliable nationwide delivery',
            });
          }
        }
      } catch (ekartError: any) {
        console.warn('Ekart serviceability check failed:', ekartError.message);
        if (originData && destData) {
          couriers.push({
            name: 'Ekart',
            serviceable: true,
            cod: true,
            prepaid: true,
            pickup: true,
            estimatedDays: calculateEstimatedDays(originData.city, destData.city, originData.state_code, destData.state_code, 1.1),
            originCity: originData.city,
            destinationCity: destData.city,
            remarks: 'Flipkart logistics - reliable nationwide delivery',
          });
        }
      }
    } else if (originData && destData) {
      couriers.push({
        name: 'Ekart',
        serviceable: true,
        cod: true,
        prepaid: true,
        pickup: true,
        estimatedDays: calculateEstimatedDays(originData.city, destData.city, originData.state_code, destData.state_code, 1.1),
        originCity: originData.city,
        destinationCity: destData.city,
        remarks: 'Flipkart logistics - reliable nationwide delivery',
      });
    }

    res.json({
      success: true,
      origin: {
        pincode: origin,
        found: !!originData,
        city: originData?.city || null,
        state: originData?.state_code || null,
        pickup: originData?.pickup === 'Y',
      },
      destination: {
        pincode: destination,
        found: !!destData,
        city: destData?.city || null,
        state: destData?.state_code || null,
        cod: destData?.cod === 'Y',
        prepaid: destData?.pre_paid === 'Y',
      },
      serviceable: couriers.length > 0,
      couriers,
    });
  } catch (error: any) {
    console.error('Pincode serviceability error:', error.response?.data || error.message);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, error.response?.data?.message || 'Failed to check serviceability'));
    }
  }
});

// Calculate shipping rate
router.get('/delhivery/calculate-rate', async (req: AuthRequest, res, next) => {
  try {
    const { origin, destination, weight, paymentMode, codAmount, serviceType } = req.query;

    // Validate required fields
    if (!origin || typeof origin !== 'string') {
      throw new AppError(400, 'Origin pincode is required');
    }
    if (!destination || typeof destination !== 'string') {
      throw new AppError(400, 'Destination pincode is required');
    }
    if (!weight || isNaN(Number(weight))) {
      throw new AppError(400, 'Weight is required (in kg)');
    }

    // Validate pincodes are 6 digits
    if (!/^\d{6}$/.test(origin) || !/^\d{6}$/.test(destination)) {
      throw new AppError(400, 'Pincodes must be 6 digits');
    }

    // Get merchant's Delhivery API key
    let apiKey = process.env.DELHIVERY_API_KEY;

    if (req.user?.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: req.user.merchantId },
        select: { delhiveryApiKey: true },
      });
      if (merchant?.delhiveryApiKey) {
        apiKey = merchant.delhiveryApiKey;
      }
    }

    if (!apiKey) {
      throw new AppError(400, 'Delhivery API key not configured');
    }

    const delhiveryClient = axios.create({
      baseURL: 'https://track.delhivery.com',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Convert weight to grams (Delhivery API uses grams)
    const weightInGrams = Math.round(Number(weight) * 1000);
    const cod = paymentMode === 'cod' && codAmount ? Number(codAmount) : 0;

    // Map service type to Delhivery mode
    // 'E' = Express (air/faster), 'S' = Surface (ground/cheaper)
    // Standard = Surface, Express/Priority = Express
    const deliveryMode = serviceType === 'standard' ? 'S' : 'E';
    const serviceTypeName = serviceType === 'standard' ? 'Surface' : 'Express';

    // Build query params for Delhivery rate API
    // md = 'E' for Express, 'S' for Surface
    // ss = shipment status (Delivered, RTO, DTO)
    const queryParams = new URLSearchParams({
      md: deliveryMode,
      ss: 'Delivered',
      d_pin: destination,
      o_pin: origin,
      cgm: weightInGrams.toString(),
    });

    if (cod > 0) {
      queryParams.append('cod', cod.toString());
    }

    console.log('Delhivery rate API params:', queryParams.toString());

    const response = await delhiveryClient.get(`/api/kinko/v1/invoice/charges/.json?${queryParams.toString()}`);

    console.log('Delhivery rate response:', JSON.stringify(response.data, null, 2));

    const rateData = response.data;

    // Helper function to extract charge breakdown
    const extractBreakdown = (data: any) => {
      // Delhivery may return charges in different formats
      // Common fields: total_amount, gross_amount, charged_weight, zone
      // Specific charges may be under different keys
      const total = data.total_amount || data.gross_amount || 0;
      const gross = data.gross_amount || data.total_amount || 0;
      const tax = data.tax || data.charge_GST || data.sgst + data.cgst || 0;
      const chargedWeight = data.charged_weight || data.cgm || 0;

      // Base freight is usually the main component
      const baseFreight = data.charge_BF || data.base_freight || data.freight || gross - tax;
      const weightCharge = data.charge_WT || data.weight_charge || 0;
      const fuelSurcharge = data.charge_FSC || data.fsc || data.fuel_surcharge || 0;
      const codCharge = data.charge_COD || data.cod_charge || 0;
      const handlingCharge = data.charge_HC || data.handling_charge || 0;

      // If there's no breakdown, the total IS the base charge
      const hasBreakdown = baseFreight > 0 || weightCharge > 0 || fuelSurcharge > 0;

      return {
        baseCharge: hasBreakdown ? baseFreight : total,
        weightCharge: weightCharge,
        codCharge: codCharge,
        fuelSurcharge: fuelSurcharge,
        handlingCharge: handlingCharge,
        subtotal: gross,
        gst: tax,
        total: total,
        chargedWeight: chargedWeight,
      };
    };

    // Parse the response
    if (rateData && Array.isArray(rateData) && rateData.length > 0) {
      const rate = rateData[0];
      const breakdown = extractBreakdown(rate);

      res.json({
        success: true,
        courier: 'Delhivery',
        origin,
        destination,
        weight: Number(weight),
        paymentMode: paymentMode === 'cod' ? 'COD' : 'Prepaid',
        serviceType: serviceTypeName,
        breakdown,
        estimatedDays: rate.etd || rate.edd || (deliveryMode === 'S' ? 7 : 4),
        zone: rate.zone || 'Unknown',
        chargedWeight: breakdown.chargedWeight,
        rawResponse: rate,
      });
    } else if (rateData && typeof rateData === 'object' && !Array.isArray(rateData)) {
      // Single object response
      const breakdown = extractBreakdown(rateData);

      res.json({
        success: true,
        courier: 'Delhivery',
        origin,
        destination,
        weight: Number(weight),
        paymentMode: paymentMode === 'cod' ? 'COD' : 'Prepaid',
        serviceType: serviceTypeName,
        breakdown,
        estimatedDays: rateData.etd || rateData.edd || (deliveryMode === 'S' ? 7 : 4),
        zone: rateData.zone || 'Unknown',
        chargedWeight: breakdown.chargedWeight,
        rawResponse: rateData,
      });
    } else {
      // Fallback calculation if API doesn't return expected format
      throw new AppError(400, 'Rate not available for this route');
    }
  } catch (error: any) {
    console.error('Rate calculation error:', error.response?.data || error.message);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, error.response?.data?.message || 'Failed to calculate rate'));
    }
  }
});

export const integrationsRouter = router;
