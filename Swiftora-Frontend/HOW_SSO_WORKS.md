# 🎯 How Swiftora Single Sign-On Works

## Your Question:
> "If I'm a user and I've used Swiftora, I need to be able to login to Swiftora, single sign-on to Delhivery account, and get idea about all my shippings. How are we going to do that?"

## ✅ Complete Answer:

### **The Solution: Unified Dashboard with Delhivery Integration**

When a user logs into Swiftora, they get **ONE unified view** of ALL their shipments - both created through Swiftora AND their existing Delhivery shipments.

---

## 🔄 How It Works:

### **Step 1: User Registers on Swiftora**
```
User → Register → Creates Swiftora account → Gets JWT token
```

### **Step 2: (Optional) Connect Delhivery Account**
```
Settings → Connect Delhivery Account
→ Enter their Delhivery API Key
→ Swiftora stores it securely
→ Now connected!
```

### **Step 3: Automatic Sync**
```
Login → System checks if Delhivery connected
→ If yes, shows ALL orders:
   ├── Orders created via Swiftora
   └── Orders from their Delhivery account
```

---

## 📊 User Experience:

### **Login Flow:**
```
1. User visits Swiftora.com
2. Clicks "Login"
3. Enters email + password
4. Gets JWT token
5. Redirected to Dashboard
6. Dashboard shows:
   ✓ Orders created via Swiftora
   ✓ Orders from Delhivery (if connected)
   ✓ All tracking info
   ✓ Analytics across all orders
```

### **Tracking Flow:**
```
Option A: Public Tracking (No login needed)
- User enters AWB/Order ID on /tracking page
- System fetches from Delhivery API
- Shows tracking details

Option B: Dashboard Tracking (Logged in)
- User logs in
- Goes to "My Orders" tab
- Sees ALL their shipments
- Click any order → see full tracking
- Faster (from our database + Delhivery)
```

---

## 🔐 Single Sign-On Architecture:

### **What Happens Behind the Scenes:**

1. **User registers with Swiftora:**
   - Email: user@example.com
   - Password: ••••••••
   - Creates Merchant account

2. **User connects Delhivery:**
   ```json
   POST /api/integrations/delhivery/connect
   {
     "apiKey": "user-delhivery-api-key"
   }
   ```
   - Swiftora stores their Delhivery API key
   - Tests connection
   - Enables integration

3. **When user creates orders:**
   ```
   Create Order in Swiftora
   → Calls Delhivery API using their key
   → Gets AWB
   → Stores in Swiftora database
   → User sees order in dashboard
   ```

4. **When user tracks shipments:**
   ```
   Dashboard → My Orders
   → Shows orders from:
      a) Swiftora database (orders they created)
      b) Delhivery webhooks (status updates)
   
   OR
   
   Public Page → Enter AWB
   → Fetches live from Delhivery API
   → Shows tracking timeline
   ```

---

## 🎨 Dashboard Layout:

```
┌─────────────────────────────────────────────────┐
│  SWIFTORA DASHBOARD                              │
├─────────────────────────────────────────────────┤
│                                                   │
│  📊 Overview                                      │
│  ├─ Total Orders: 1,234                          │
│  ├─ In Transit: 45                               │
│  ├─ Delivered: 1,150                             │
│  └─ Wallet Balance: ₹50,000                      │
│                                                   │
│  📦 MY ORDERS                                     │
│  ┌──────────────────────────────────────────┐   │
│  │ Filter: [All] [Swiftora] [Delhivery]    │   │
│  │                                           │   │
│  │ Order #12345    📍 In Transit            │   │
│  │ AWB: 41D532A27   Created: Today          │   │
│  │ Customer: John Doe                       │   │
│  │ [Track] [Details] [Invoice]             │   │
│  │                                           │   │
│  │ Order #12344    ✅ Delivered             │   │
│  │ AWB: 41D532A26   Delivered: Yesterday    │   │
│  │ [Track] [Details]                        │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  🔗 INTEGRATIONS                                 │
│  Delhivery: ✅ Connected                         │
│  Last Sync: 2 hours ago                          │
│  [Sync Now] [Disconnect]                         │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Status:

### **✅ Already Built:**

1. **Authentication System**
   - User registration
   - Login with JWT
   - Session management
   - Auto-logout on 401

2. **Order Management**
   - Create orders
   - List all orders
   - Filter & search
   - Track by AWB

3. **Delhivery Integration**
   - API client
   - Shipment creation
   - Live tracking
   - Webhook handling

### **🆕 Just Added:**

4. **Delhivery Account Connection**
   - Connect Delhivery account
   - Store API credentials per merchant
   - Disconnect option
   - Status check API

5. **Unified Orders View**
   - See all orders (Swiftora + Delhivery)
   - Filter by source
   - Sync on demand

---

## 📝 API Endpoints:

### **Integration APIs (NEW):**

```bash
# Connect Delhivery account
POST /api/integrations/delhivery/connect
Authorization: Bearer <token>
{
  "apiKey": "merchant-delhivery-key",
  "clientId": "optional-client-id"
}

# Check connection status
GET /api/integrations/delhivery/status
Authorization: Bearer <token>

# Sync orders (manual trigger)
POST /api/integrations/delhivery/sync
Authorization: Bearer <token>

# Get ALL orders (unified view)
GET /api/integrations/orders/all?source=all
Authorization: Bearer <token>
# source: 'all' | 'swiftora' | 'delhivery'

# Disconnect
POST /api/integrations/delhivery/disconnect
Authorization: Bearer <token>
```

### **Existing Tracking APIs:**

```bash
# Public tracking (no auth)
GET /api/tracking/track?awb=41D532A27

# Dashboard tracking (with auth)
GET /api/orders
GET /api/orders/:id
```

---

## 🔒 Security:

1. **Per-Merchant Credentials:**
   - Each merchant stores their own Delhivery API key
   - Isolated access
   - No cross-merchant data leakage

2. **JWT Authentication:**
   - Secure token-based auth
   - Auto-expiry (7 days)
   - Stored in localStorage

3. **API Key Storage:**
   - Encrypted in database
   - Only used server-side
   - Never exposed to frontend

---

## 💡 Usage Examples:

### **Example 1: New User**
```
1. User signs up → Creates "Test Company"
2. Goes to Settings → "Connect Delhivery"
3. Enters Delhivery API key → Connected!
4. Dashboard now shows:
   - 0 Swiftora orders (new account)
   - Can create new orders
   - Track any shipment via tracking page
```

### **Example 2: Existing Delhivery User**
```
1. User has 1000+ shipments in Delhivery
2. Signs up on Swiftora
3. Connects Delhivery account
4. Orders are synced via webhooks
5. Dashboard shows all shipments
6. Can create new orders via Swiftora
7. All tracking in one place
```

### **Example 3: Track Shipment**
```
Public User (No login):
- Visit swiftora.com/tracking
- Enter AWB: 41D532A27
- See tracking timeline
- No account needed

Logged-in User:
- Login → Dashboard → My Orders
- See all orders in table
- Click "Track" on any order
- See timeline + details
- Faster (from cache)
```

---

## 🎯 Benefits:

✅ **Single Login** → Access everything
✅ **Unified Dashboard** → All orders in one place
✅ **No Duplicate Entry** → Connect once, see all
✅ **Live Tracking** → Real-time updates
✅ **Secure** → Per-merchant isolation
✅ **Fast** → Database caching
✅ **Flexible** → Works with/without Delhivery connection

---

## 🔄 How to Use (Step-by-Step):

### **Setup:**
```bash
# 1. Update database schema
cd server
npm run db:push

# 2. Restart backend
npm run dev

# 3. Open Swiftora
# Frontend already has auth working!
```

### **As a User:**
```
1. Go to http://localhost:8080/login
2. Register → Email + Password + Company Name
3. Login → Get JWT token
4. Dashboard opens automatically
5. Go to Settings
6. Find "Delhivery Integration" section
7. Enter your Delhivery API Key
8. Click "Connect"
9. Done! Now all orders visible
```

---

## 📦 Database Updates:

**Merchant table now has:**
```prisma
model Merchant {
  // ... existing fields
  
  // NEW: Delhivery Integration
  delhiveryApiKey   String?   // Their Delhivery API key
  delhiveryClientId String?   // Optional client ID
  delhiveryEnabled  Boolean   // Connection status
  delhiveryLastSync DateTime? // Last sync time
}
```

---

## 🎬 What's Next:

1. **Update database:** `cd server; npm run db:push`
2. **Restart backend:** Backend auto-restarts if using `npm run dev`
3. **Test connection:** Register → Connect Delhivery
4. **Create orders:** Create order → Gets AWB → See in dashboard
5. **Track anywhere:** Public page or dashboard

---

## ✨ Summary:

**Your Question:** How do users login once and see all shipments?

**Answer:** 
- User registers on Swiftora (1 time)
- Optionally connects their Delhivery account (1 time)
- Login once → See ALL orders (Swiftora + Delhivery)
- Track any shipment via AWB/Order ID
- Everything in one unified dashboard

**No need for multiple logins!** One Swiftora account = Access to everything.

---

**Ready to test! Just run:**
```bash
cd server
npm run db:push   # Update database
npm run dev       # Start backend
```

Then register and connect your Delhivery account! 🚀
