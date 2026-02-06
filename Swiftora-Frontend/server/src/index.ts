import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { pickupsRouter } from './routes/pickups.js';
import { trackingRouter } from './routes/tracking.js';
import { serviceabilityRouter } from './routes/serviceability.js';
import { ratesRouter } from './routes/rates.js';
import { dashboardRouter } from './routes/dashboard.js';
import { webhooksRouter } from './routes/webhooks.js';
import { warehousesRouter } from './routes/warehouses.js';
import { integrationsRouter } from './routes/integrations.js';
import { adminRouter } from './routes/admin.js';
import { ticketsRouter } from './routes/tickets.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: allow frontend origins (Render + custom domain + local dev)
const allowedOrigins = [
  'https://swiftora-final-1.onrender.com',
  'https://swiftora-final.onrender.com',
  'https://swiftora.co',
  'https://www.swiftora.co',
  'http://localhost:8080',
  'http://localhost:8081',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// XPRESSBEES DEBUG TEST ENDPOINT (NO AUTH)
// ============================================================
import axios from 'axios';

app.get('/api/test-xpressbees', async (req, res) => {
  try {
    const token = process.env.XPRESSBEES_TOKEN || '';
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

    console.log('=== XPRESSBEES DIRECT TEST ===');
    console.log('Token exists:', !!cleanToken);
    console.log('Token length:', cleanToken.length);
    console.log('Token preview:', cleanToken ? cleanToken.substring(0, 30) + '...' : 'EMPTY');

    if (!cleanToken) {
      return res.status(400).json({
        error: 'XPRESSBEES_TOKEN env not set',
        envKeys: Object.keys(process.env).filter(k => k.toUpperCase().includes('XPRESS'))
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
    res.json({
      success: true,
      tokenLength: cleanToken.length,
      xpressbeesResponse: response.data
    });
  } catch (error: any) {
    console.log('=== XPRESSBEES ERROR ===');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data));

    res.status(error.response?.status || 500).json({
      error: 'Xpressbees API call failed',
      status: error.response?.status,
      xpressbeesError: error.response?.data,
      message: error.message
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
app.use('/api/webhooks', webhooksRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tickets', ticketsRouter);

// Error handling
app.use(errorHandler);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export app for Vercel
export default app;

// Start server only in local/non-serverless environments
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Swiftora Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
}
