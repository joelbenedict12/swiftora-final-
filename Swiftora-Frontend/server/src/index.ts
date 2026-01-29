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

// Simple CORS configuration that works on Vercel
app.use(cors({
  origin: true, // Allow all origins in development, Vercel will handle this
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
