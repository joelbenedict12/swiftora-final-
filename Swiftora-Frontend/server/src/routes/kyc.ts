import { Router } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const DIDIT_BASE = 'https://verification.didit.me';
const DIDIT_SESSION_PATH = '/v1/session/';
const DIDIT_AUTH_URL = 'https://apx.didit.me/auth/v2/token';
const DIDIT_AUTH_TIMEOUT_MS = 20000;
const DIDIT_SESSION_TIMEOUT_MS = 60000;

const diditClient = axios.create({
  validateStatus: () => true,
  headers: { 'Content-Type': 'application/json' },
});

/** Get Bearer token: from Client ID+Secret exchange, or use DIDIT_API_KEY as Bearer if set. */
async function getDiditBearerToken(): Promise<string> {
  const clientId = process.env.DIDIT_CLIENT_ID;
  const clientSecret = process.env.DIDIT_CLIENT_SECRET;
  const apiKey = process.env.DIDIT_API_KEY;

  if (clientId && clientSecret) {
    try {
      console.log('[KYC] Calling Didit auth...', DIDIT_AUTH_URL);
      const { data, status } = await diditClient.post<{ access_token?: string }>(
        DIDIT_AUTH_URL,
        { client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' },
        { timeout: DIDIT_AUTH_TIMEOUT_MS }
      );
      console.log('[KYC] Didit auth responded:', status, data?.access_token ? '(token received)' : data);
      if (status !== 200 || !data?.access_token) {
        console.error('Didit auth error:', status, data);
        throw new AppError(502, data && typeof data === 'object' && 'message' in data ? String((data as any).message) : 'Didit auth failed');
      }
      return data.access_token;
    } catch (e: any) {
      console.log('[KYC] Didit auth error raw:', e?.code, e?.message, e?.response?.status);
      if (e instanceof AppError) throw e;
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) throw new AppError(504, `Didit auth timed out. Check DIDIT_CLIENT_ID/SECRET and Didit status.`);
      throw new AppError(502, e.response?.data?.message || e.message || 'Didit auth failed');
    }
  }

  if (apiKey) return apiKey;
  throw new AppError(503, 'KYC not configured: set DIDIT_API_KEY or DIDIT_CLIENT_ID + DIDIT_CLIENT_SECRET');
}

const router = Router();
router.use(authenticate);

// GET /api/kyc — current KYC status for the merchant
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      return res.json({
        businessDocuments: { status: 'Pending' },
        bankAccount: { status: 'Pending' },
        identityVerification: { status: 'Pending' },
      });
    }

    const kyc = await prisma.kycVerification.findUnique({
      where: { merchantId: req.user.merchantId },
    });

    const status = kyc?.status || 'Pending';
    const isVerified = status === 'Approved';

    res.json({
      businessDocuments: { status: isVerified ? 'Verified' : 'Pending' },
      bankAccount: { status: 'Pending' },
      identityVerification: {
        status: isVerified ? 'Verified' : status === 'Declined' ? 'Declined' : 'Pending',
        diditSessionId: kyc?.diditSessionId,
      },
      lastUpdated: kyc?.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/kyc/session — create Didit verification session, return URL for redirect
router.post('/session', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const callbackUrl = process.env.DIDIT_CALLBACK_URL || `${process.env.FRONTEND_URL || 'https://swiftora-frontend-one.vercel.app'}/dashboard/settings/security`;
    const vendorData = req.user.merchantId;

    const bearerToken = await getDiditBearerToken();

    const sessionUrl = `${DIDIT_BASE}${DIDIT_SESSION_PATH}`;
    const payload = { callback: callbackUrl, vendor_data: vendorData, features: 'OCR + FACE' };
    const headers = { Authorization: `Bearer ${bearerToken}` };

    try {
      console.log('[KYC] Calling Didit session create...', sessionUrl);
      const { data, status } = await diditClient.post<{ session_id?: string; url?: string; session_token?: string; status?: string }>(
        sessionUrl,
        payload,
        { headers, timeout: DIDIT_SESSION_TIMEOUT_MS }
      );
      console.log('[KYC] Didit session responded:', status, data ? { session_id: data.session_id, url: data.url } : data);

      if (status >= 200 && status < 300 && data) {
        await prisma.kycVerification.upsert({
          where: { merchantId: req.user.merchantId },
          create: {
            merchantId: req.user.merchantId,
            diditSessionId: data.session_id || null,
            vendorData,
            status: 'Pending',
          },
          update: {
            diditSessionId: data.session_id || undefined,
            vendorData,
            status: 'Pending',
          },
        });
        return res.json({
          success: true,
          url: data.url || `https://verify.didit.me/session/${data.session_token || data.session_id}`,
          sessionId: data.session_id,
        });
      }

      const msg = (data as any)?.message || (data as any)?.detail || (data as any)?.error || `Didit returned ${status}`;
      console.error('Didit create session error:', status, data);
      throw new AppError(502, msg);
    } catch (e: any) {
      console.log('[KYC] Didit session error raw:', e?.code, e?.message, e?.response?.status, e?.response?.data);
      if (e instanceof AppError) throw e;
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) throw new AppError(504, 'Didit did not respond in time. Check DIDIT_API_KEY and Didit status.');
      const msg = e.response?.data?.message || e.response?.data?.detail || e.message || 'Failed to create verification session';
      throw new AppError(502, msg);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    next(error);
  }
});

export const kycRouter = router;
