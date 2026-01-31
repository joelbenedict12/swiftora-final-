import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '../src/middleware/error.js';
import { authRouter } from '../src/routes/auth.js';
import { ordersRouter } from '../src/routes/orders.js';
import { pickupsRouter } from '../src/routes/pickups.js';
import { trackingRouter } from '../src/routes/tracking.js';
import { serviceabilityRouter } from '../src/routes/serviceability.js';
import { ratesRouter } from '../src/routes/rates.js';
import { dashboardRouter } from '../src/routes/dashboard.js';
import { webhooksRouter } from '../src/routes/webhooks.js';
import { warehousesRouter } from '../src/routes/warehouses.js';
import { integrationsRouter } from '../src/routes/integrations.js';
import { adminRouter } from '../src/routes/admin.js';
import { ticketsRouter } from '../src/routes/tickets.js';
import { kycRouter } from '../src/routes/kyc.js';
import { diditWebhookHandler } from '../src/routes/diditWebhook.js';

dotenv.config();

const app = express();

// List of allowed origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'https://swiftora-frontend-one.vercel.app',
  process.env.FRONTEND_URL,
];

// Helper to check if origin is allowed
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return allowedOrigins.some(allowed => allowed && origin.startsWith(allowed)) ||
    (origin.includes('swiftora-frontend') && origin.includes('.vercel.app'));
}

// CORS middleware - MUST be first
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.log('Origin blocked by CORS:', origin);
      callback(null, true); // Allow all for now, tighten in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes - CRITICAL for preflight
app.options('*', cors(corsOptions));

// Didit webhook: GET so you can verify URL in browser; POST for actual webhooks
app.get('/api/webhooks/didit', (_req: any, res: any) => {
  res.status(200).json({ ok: true, message: 'Didit webhook endpoint — use POST for webhooks' });
});
app.use(
  '/api/webhooks/didit',
  express.raw({ type: 'application/json' }),
  (req: any, res: any, next: any) => {
    diditWebhookHandler(req, res).catch(next);
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check database connectivity
app.get('/api/debug', async (req: any, res: any) => {
  try {
    const { prisma } = await import('../src/lib/prisma.js');

    // Check if DATABASE_URL is set
    const dbUrlSet = !!process.env.DATABASE_URL;
    const dbUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) + '...';

    // Try to connect to database
    const userCount = await prisma.user.count();

    res.json({
      status: 'ok',
      database: {
        connected: true,
        urlSet: dbUrlSet,
        urlPrefix: dbUrlPrefix,
        userCount
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        jwtSecretSet: !!process.env.JWT_SECRET,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      database: {
        connected: false,
        urlSet: !!process.env.DATABASE_URL,
        urlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      },
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      }
    });
  }
});

// Test Delhivery API key endpoint
app.get('/api/test-delhivery', async (req: any, res: any) => {
  const apiKey = process.env.DELHIVERY_API_KEY;
  if (!apiKey) {
    return res.json({ connected: false, error: 'DELHIVERY_API_KEY not set' });
  }

  try {
    const axios = (await import('axios')).default;
    const response = await axios.get('https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=560068', {
      headers: { 'Authorization': `Token ${apiKey}` }
    });
    res.json({ connected: true, apiKeyConfigured: true });
  } catch (error: any) {
    res.json({
      connected: error.response?.status !== 401,
      apiKeyConfigured: true,
      error: error.response?.status === 401 ? 'Invalid API key' : error.message
    });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/pickups', pickupsRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/serviceability', serviceabilityRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/tickets', ticketsRouter);

// Error handler
app.use(errorHandler);

// Export as Vercel serverless function handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers directly on preflight requests
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '';
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    return res.status(200).end();
  }

  // Set CORS headers on all responses
  const origin = req.headers.origin || '';
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  return app(req, res as any);
}
