import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import axios from 'axios';

const router = Router();
const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';

const CalculateRateSchema = z.object({
  originPincode: z.string(),
  destinationPincode: z.string(),
  weight: z.number(),
  paymentMode: z.enum(['PREPAID', 'COD']),
  codAmount: z.number().optional(),
});

router.post('/calculate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = CalculateRateSchema.parse(req.body);
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
      throw new AppError(400, 'Delhivery integration not configured. Please connect your account in settings.');
    }
    
    // Check cache
    const cached = await prisma.rateCache.findFirst({
      where: {
        merchantId,
        originPincode: data.originPincode,
        destinationPincode: data.destinationPincode,
        weight: data.weight,
        paymentMode: data.paymentMode,
        expiresAt: { gt: new Date() },
      },
    });

    if (cached) {
      return res.json({
        rate: cached.rate,
        courierName: cached.courierName,
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

    // Fetch from Delhivery
    const response = await delhiveryClient.post('/api/v1/rates/json/', {
      origin_pin: data.originPincode,
      destination_pin: data.destinationPincode,
      weight: data.weight,
      payment_mode: data.paymentMode === 'COD' ? 'COD' : 'Prepaid',
      cod_amount: data.codAmount || 0,
    });

    const rate = response.data[0]?.total_amount || 0;

    // Cache for 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.rateCache.create({
      data: {
        merchantId,
        originPincode: data.originPincode,
        destinationPincode: data.destinationPincode,
        weight: data.weight,
        paymentMode: data.paymentMode,
        rate,
        courierName: 'Delhivery',
        expiresAt,
      },
    });

    res.json({
      rate,
      courierName: 'Delhivery',
      breakdown: response.data[0],
      cached: false,
    });
  } catch (error) {
    next(error);
  }
});

export const ratesRouter = router;
