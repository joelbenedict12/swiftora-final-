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

dotenv.config();

const app = express();

// CORS with proper configuration - allow all Vercel deployments
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5173',
      'https://swiftora-frontend-one.vercel.app',
      process.env.FRONTEND_URL,
    ];

    // Check if origin is in allowed list or is a Vercel preview deployment
    const isAllowed = allowedOrigins.some(allowed => allowed && origin.startsWith(allowed)) ||
      origin.includes('swiftora-frontend') && origin.includes('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Origin blocked by CORS:', origin);
      callback(null, true); // Allow anyway for development - change to false in production if needed
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Preflight handler
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Manual CORS headers as additional fallback for Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5173',
      'https://swiftora-frontend-one.vercel.app',
      process.env.FRONTEND_URL,
    ];

    const isAllowed = allowedOrigins.some(allowed => allowed && origin.startsWith(allowed)) ||
      (origin.includes('swiftora-frontend') && origin.includes('.vercel.app'));

    if (isAllowed || !origin) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    }
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
app.use('/api/webhooks', webhooksRouter);

// Error handler
app.use(errorHandler);

export default app;
