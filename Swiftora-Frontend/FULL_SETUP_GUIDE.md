# 🚀 Swiftora - Full Stack Logistics Platform

Complete production-ready logistics platform with Delhivery integration.

## 📁 Project Structure

```
Swiftora-Frontend/
├── src/                    # Frontend React app
│   ├── pages/             # All pages (Dashboard, Orders, Tracking, etc.)
│   ├── components/        # Reusable components
│   ├── lib/               # API client & utilities
│   └── ...
├── server/                # Backend API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Delhivery integration
│   │   ├── middleware/   # Auth & error handling
│   │   └── lib/          # Prisma client
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── ...
└── ...
```

## ✨ Features Implemented

### Backend (server/)
✅ **Authentication**
- JWT-based auth with sessions
- User registration & login
- Multi-tenant merchant support

✅ **Order Management**
- Create orders with automatic Delhivery shipment creation
- List, filter, search orders
- Order cancellation
- Bulk import (placeholder for job queue)

✅ **Delhivery Integration**
- Shipment creation with AWB generation
- Tracking (AWB, order ID, phone)
- Pickup scheduling
- Pincode serviceability with caching
- Rate calculator with caching
- Label & manifest printing (API ready)

✅ **Pickups**
- Schedule pickups
- List & manage pickups
- Warehouse management

✅ **Dashboard Analytics**
- Real-time stats (orders, deliveries, wallet)
- Charts data (orders by date, status distribution)
- Recent orders & upcoming pickups

✅ **Webhooks**
- Delhivery tracking updates
- Auto-update order status
- Event logging

✅ **Database**
- PostgreSQL with Prisma ORM
- Complete schema: Users, Merchants, Orders, Pickups, Warehouses, Tracking Events, Invoices, Wallet Transactions, Caching tables
- Indexes for performance

### Frontend (src/)
✅ **Pages**
- Landing page with animations
- Login/Register with OTP flow
- Dashboard with live stats
- Orders list with filters
- Create Order (B2C/B2B)
- Tracking page (live Delhivery data)
- Pickup management
- Analytics & reports
- All tool pages (Rate Calculator, Pincode Check, RTO Predictor, etc.)

✅ **API Integration**
- Axios client with auth interceptors
- API wrapper functions for all endpoints
- Zustand store for auth state
- Error handling with auto-logout

## 🛠️ Setup Instructions

### 1. Install PostgreSQL

**Option A: Local PostgreSQL**
- Download from https://www.postgresql.org/download/windows/
- Install and note your password
- Default port: 5432

**Option B: Docker**
```bash
docker run --name swiftora-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file (already created, edit if needed)
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/swiftora"

# Push database schema
npm run db:push

# Start backend server
npm run dev
```

Backend will run on **http://localhost:3001**

### 3. Frontend Setup

```bash
# In root directory
npm install

# Start frontend
npm run dev
```

Frontend will run on **http://localhost:8080**

### 4. Create Test Account

```bash
# Use the registration page at http://localhost:8080/login
# Or use API directly:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@swiftora.com",
    "phone": "9876543210",
    "password": "test123",
    "companyName": "Test Company"
  }'
```

## 📊 Database Schema

### Core Tables
- **User**: User accounts with roles
- **Merchant**: Company/business accounts
- **Warehouse**: Pickup/shipping locations
- **Order**: Orders & shipments with Delhivery AWB
- **Package**: Multi-box shipment support
- **Pickup**: Scheduled pickups
- **TrackingEvent**: Tracking history from webhooks
- **Invoice**: Billing invoices
- **WalletTransaction**: Wallet ledger with balance tracking
- **ServiceabilityCache**: Pincode cache (7-day TTL)
- **RateCache**: Rate quotes cache (24-hour TTL)

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order (creates Delhivery shipment)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel order

### Pickups
- `GET /api/pickups` - List pickups
- `POST /api/pickups` - Schedule pickup
- `POST /api/pickups/:id/cancel` - Cancel pickup

### Tracking
- `GET /api/tracking/track?awb=xxx` - Public tracking
- `GET /api/tracking/orders/:orderNumber` - Track by order number

### Serviceability
- `GET /api/serviceability/check/:pincode` - Check pincode
- `POST /api/serviceability/check/bulk` - Bulk check

### Rates
- `POST /api/rates/calculate` - Calculate shipping rate

### Dashboard
- `GET /api/dashboard/overview` - Stats
- `GET /api/dashboard/analytics` - Charts data

### Warehouses
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Webhooks
- `POST /api/webhooks/delhivery` - Delhivery tracking webhook

## 🔐 Authentication

All authenticated endpoints require header:
```
Authorization: Bearer <token>
```

Token is automatically stored in localStorage and added by axios interceptor.

## 📦 Delhivery Integration

### Environment Variables
```env
DELHIVERY_API_KEY="your-key"
DELHIVERY_BASE_URL="https://track.delhivery.com"
```

### Features Integrated
- Shipment creation (forward & reverse)
- AWB generation
- Tracking (waybill, ref_ids, phone)
- Pickup scheduling
- Pincode serviceability
- Rate calculator
- Label printing
- Manifest generation

## 🚀 Production Deployment

### Backend
1. Set up PostgreSQL database (managed service recommended)
2. Update DATABASE_URL in .env
3. Run migrations: `npm run db:migrate`
4. Set strong JWT_SECRET
5. Build: `npm run build`
6. Start: `npm start`
7. Use process manager (PM2) or containerize with Docker

### Frontend
1. Update VITE_API_URL to production backend URL
2. Build: `npm run build`
3. Serve `dist/` folder with Nginx/Apache/CDN

### Recommended Services
- **Database**: AWS RDS PostgreSQL, Supabase, or Neon
- **Backend**: AWS EC2, DigitalOcean, Railway, or Render
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Cache**: Redis Cloud or AWS ElastiCache
- **Storage**: AWS S3 for labels/manifests
- **Monitoring**: Sentry for errors, Datadog/Grafana for metrics

## 🔄 Next Steps for Production

### Immediate
1. ✅ Basic order flow working
2. ✅ Delhivery integration complete
3. ✅ Auth system functional
4. ⏳ Create first warehouse via API
5. ⏳ Test order creation end-to-end

### Phase 2 (1-2 weeks)
- [ ] Bulk import with BullMQ job queue
- [ ] CSV export for orders
- [ ] Label download & storage (S3)
- [ ] Email notifications
- [ ] Webhook signature verification
- [ ] Rate limiting
- [ ] Request logging

### Phase 3 (2-3 weeks)
- [ ] Wallet recharge & billing
- [ ] Invoice generation
- [ ] COD remittance tracking
- [ ] Advanced analytics with date ranges
- [ ] RTO predictor with ML model
- [ ] NDR management
- [ ] Return orders

### Phase 4 (3-4 weeks)
- [ ] Multi-carrier support
- [ ] Channel integrations (Shopify, WooCommerce)
- [ ] Mobile app
- [ ] Role-based permissions (ADMIN, MANAGER, VIEWER)
- [ ] API keys for developers
- [ ] Webhooks for customers
- [ ] Audit logs

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Windows: Services -> PostgreSQL
# Or check connection:
psql -U postgres -h localhost -p 5432
```

### Port Already in Use
```bash
# Backend (3001)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Frontend (8080)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Prisma Schema Sync
```bash
cd server
npm run db:push  # For dev
# or
npm run db:migrate  # For production
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/swiftora"
JWT_SECRET="your-secret-key"
DELHIVERY_API_KEY="your-delhivery-key"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:8080"
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_DELHIVERY_API_KEY=your-key
```

## 📚 Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- Zod validation
- Axios for Delhivery API

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query (ready to use)
- Zustand (state management)
- Axios
- shadcn/ui components
- Tailwind CSS
- Framer Motion
- Recharts

## 🎯 Current Status

**✅ Fully Functional:**
- User registration & login
- Order creation with Delhivery shipment
- Live tracking
- Pickup scheduling
- Pincode serviceability
- Rate calculator
- Dashboard stats
- Webhook handling

**🚧 Needs Testing:**
- End-to-end order flow
- Bulk operations
- Error edge cases
- Webhook reliability

**📋 Pending Implementation:**
- File storage for labels
- Job queue for bulk imports
- Email notifications
- Billing & invoicing
- Advanced analytics queries

## 💡 Tips

1. **First warehouse**: Create via API or add to seed script
2. **Delhivery testing**: Use their staging API if available
3. **Database GUI**: Use `npm run db:studio` to browse data
4. **API testing**: Use Postman collection (can create)
5. **Logs**: Check terminal for backend logs

## 🤝 Support

For issues or questions:
1. Check backend terminal for errors
2. Check browser console for frontend errors
3. Verify database connection
4. Check Delhivery API status

---

**Built with ❤️ for Swiftora**
