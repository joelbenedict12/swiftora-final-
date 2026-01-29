# Swiftora Backend

Production-ready backend for Swiftora logistics platform with full Delhivery integration.

## Features

- ✅ User authentication with JWT
- ✅ Multi-tenant merchant management
- ✅ Order creation & management
- ✅ Delhivery shipment creation & tracking
- ✅ Pickup scheduling
- ✅ Pincode serviceability with caching
- ✅ Rate calculator
- ✅ Webhook handlers for tracking updates
- ✅ Dashboard analytics
- ✅ Wallet & billing

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (optional)
- **Queue**: Bull (optional, for background jobs)

## Setup

1. **Install dependencies**:
```bash
cd server
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup database**:
```bash
npm run db:push
# or for migrations:
npm run db:migrate
```

4. **Start development server**:
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/swiftora"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
DELHIVERY_API_KEY="your-delhivery-key"
PORT=3001
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Orders
- `GET /api/orders` - List orders (paginated, filterable)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order (creates Delhivery shipment)
- `POST /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/bulk/import` - Bulk import

### Pickups
- `GET /api/pickups` - List pickups
- `GET /api/pickups/:id` - Get pickup details
- `POST /api/pickups` - Schedule pickup
- `POST /api/pickups/:id/cancel` - Cancel pickup

### Tracking
- `GET /api/tracking/track?awb=xxx` - Public tracking (no auth)
- `GET /api/tracking/orders/:orderNumber` - Track by order number

### Serviceability
- `GET /api/serviceability/check/:pincode` - Check pincode
- `POST /api/serviceability/check/bulk` - Bulk check

### Rates
- `POST /api/rates/calculate` - Calculate shipping rate

### Dashboard
- `GET /api/dashboard/overview` - Dashboard stats
- `GET /api/dashboard/analytics` - Analytics data

### Webhooks
- `POST /api/webhooks/delhivery` - Delhivery tracking webhook

## Database Schema

Core tables:
- `User` - User accounts
- `Merchant` - Merchant/company accounts
- `Warehouse` - Pickup locations
- `Order` - Orders & shipments
- `Pickup` - Pickup requests
- `TrackingEvent` - Tracking history
- `Invoice` - Billing invoices
- `WalletTransaction` - Wallet ledger
- `ServiceabilityCache` - Pincode cache
- `RateCache` - Rate cache

## Production Deployment

1. Set up PostgreSQL database
2. Configure all environment variables
3. Run migrations: `npm run db:migrate`
4. Build: `npm run build`
5. Start: `npm start`

Consider:
- Redis for caching & queues
- CDN/S3 for label storage
- Load balancer for scaling
- Monitoring (Sentry, Datadog, etc.)

## Development

```bash
# Watch mode
npm run dev

# Database studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```
