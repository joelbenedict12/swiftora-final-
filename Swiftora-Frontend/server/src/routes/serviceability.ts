import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import axios from 'axios';

const router = Router();
const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';

// Public serviceability check
router.get('/check/:pincode', async (req, res, next) => {
  try {
    const { pincode } = req.params;
    
    // Check cache first
    const cached = await prisma.serviceabilityCache.findUnique({
      where: { pincode },
    });

    if (cached && (Date.now() - cached.updatedAt.getTime()) < 7 * 24 * 60 * 60 * 1000) {
      return res.json({
        pincode: cached.pincode,
        city: cached.city,
        state: cached.state,
        serviceable: cached.serviceable,
        couriers: cached.couriers,
        cached: true,
      });
    }

    // Fetch from Delhivery using environment default key (for public check)
    const apiKey = process.env.DELHIVERY_API_KEY;
    if (!apiKey) {
      throw new AppError(500, 'Delhivery API key not configured');
    }

    const delhiveryClient = axios.create({
      baseURL: DELHIVERY_BASE_URL,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await delhiveryClient.get('/api/v1/pin-codes/json/', {
      params: { pin_code: pincode },
    });
    
    const deliveryCodes = result.data.delivery_codes?.[0];
    const serviceable = deliveryCodes?.postal_code?.cod === 'Y' || deliveryCodes?.postal_code?.prepaid === 'Y';

    // Update cache
    await prisma.serviceabilityCache.upsert({
      where: { pincode },
      update: {
        city: deliveryCodes?.postal_code?.city,
        state: deliveryCodes?.postal_code?.state_code,
        serviceable,
        couriers: ['Delhivery'],
      },
      create: {
        pincode,
        city: deliveryCodes?.postal_code?.city,
        state: deliveryCodes?.postal_code?.state_code,
        serviceable,
        couriers: ['Delhivery'],
      },
    });

    res.json({
      pincode,
      city: deliveryCodes?.postal_code?.city,
      state: deliveryCodes?.postal_code?.state_code,
      serviceable,
      couriers: ['Delhivery'],
      cached: false,
    });
  } catch (error) {
    next(error);
  }
});

// Merchant-specific serviceability check
router.get('/check/:pincode/merchant', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { pincode } = req.params;
    const merchantId = req.user!.merchantId;

    if (!merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Get merchant's Delhivery API key
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { delhiveryApiKey: true, delhiveryEnabled: true },
    });

    if (!merchant?.delhiveryEnabled || !merchant?.delhiveryApiKey) {
      throw new AppError(400, 'Delhivery integration not configured');
    }
    
    // Check cache first
    const cached = await prisma.serviceabilityCache.findUnique({
      where: { pincode },
    });

    if (cached && (Date.now() - cached.updatedAt.getTime()) < 7 * 24 * 60 * 60 * 1000) {
      return res.json({
        pincode: cached.pincode,
        city: cached.city,
        state: cached.state,
        serviceable: cached.serviceable,
        couriers: cached.couriers,
        cached: true,
      });
    }

    // Create Delhivery client with merchant's API key
    const delhiveryClient = axios.create({
      baseURL: DELHIVERY_BASE_URL,
      headers: {
        'Authorization': `Token ${merchant.delhiveryApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await delhiveryClient.get('/api/v1/pin-codes/json/', {
      params: { pin_code: pincode },
    });
    
    const deliveryCodes = result.data.delivery_codes?.[0];
    const serviceable = deliveryCodes?.postal_code?.cod === 'Y' || deliveryCodes?.postal_code?.prepaid === 'Y';

    // Update cache
    await prisma.serviceabilityCache.upsert({
      where: { pincode },
      update: {
        city: deliveryCodes?.postal_code?.city,
        state: deliveryCodes?.postal_code?.state_code,
        serviceable,
        couriers: ['Delhivery'],
      },
      create: {
        pincode,
        city: deliveryCodes?.postal_code?.city,
        state: deliveryCodes?.postal_code?.state_code,
        serviceable,
        couriers: ['Delhivery'],
      },
    });

    res.json({
      pincode,
      city: deliveryCodes?.postal_code?.city,
      state: deliveryCodes?.postal_code?.state_code,
      serviceable,
      couriers: ['Delhivery'],
      cached: false,
    });
  } catch (error) {
    next(error);
  }
});

// Bulk pincode check
router.post('/check/bulk', async (req, res, next) => {
  try {
    const { pincodes } = req.body;
    
    if (!Array.isArray(pincodes)) {
      return res.status(400).json({ error: 'pincodes must be an array' });
    }

    const results = await Promise.all(
      pincodes.slice(0, 100).map(async (pincode) => {
        try {
          const cached = await prisma.serviceabilityCache.findUnique({
            where: { pincode: pincode.toString() },
          });
          
          if (cached) {
            return {
              pincode: cached.pincode,
              serviceable: cached.serviceable,
              city: cached.city,
              state: cached.state,
            };
          }
          
          return { pincode, serviceable: null, message: 'Not in cache' };
        } catch {
          return { pincode, serviceable: null, error: true };
        }
      })
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

export const serviceabilityRouter = router;
