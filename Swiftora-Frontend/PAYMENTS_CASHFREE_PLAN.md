# Cashfree Payment Integration Plan

## Overview

Swiftora uses **Cashfree** for:
1. **Wallet Recharge** – Merchants add funds to pay for prepaid shipping
2. **Invoice Payment** – Pay pending shipping invoices
3. **COD Remittance** (optional later) – Cashfree Payouts to disburse COD to merchants

---

## 1. Cashfree Setup

### Create Account
- Sign up at [cashfree.com](https://www.cashfree.com)
- Complete KYC (business verification)
- Get **App ID** and **Secret Key** from Dashboard → Developers → API Keys

### Modes
- **Sandbox**: `https://sandbox.cashfree.com/pg` (for testing)
- **Production**: `https://api.cashfree.com/pg` (go-live)

---

## 2. Architecture

```
Frontend (Billing)  →  Backend API  →  Cashfree Create Order  →  payment_session_id
       ↓
Frontend loads Cashfree Checkout.js with session_id
       ↓
User pays (UPI/Card/NetBanking)
       ↓
Cashfree sends webhook  →  Backend verifies  →  Credit wallet  →  Update DB
       ↓
Frontend redirect/success page
```

---

## 3. Backend Routes (to add)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/payments/create-order` | Create Cashfree order, return `payment_session_id` |
| POST | `/api/payments/webhook` | Handle Cashfree payment status webhook |
| GET | `/api/payments/order-status/:orderId` | Check payment status (optional) |
| GET | `/api/billing/wallet` | Get merchant wallet balance + transactions |

---

## 4. Database Changes

### Option A: New `Payment` model (recommended)
```prisma
model Payment {
  id              String   @id @default(cuid())
  merchantId      String
  merchant        Merchant @relation(...)
  
  cfOrderId       String   @unique  // Cashfree order ID
  cfPaymentId     String?
  orderAmount     Decimal  @db.Decimal(12, 2)
  orderStatus     String   // CREATED, PAID, ACTIVE, EXPIRED...
  
  type            String   // RECHARGE, INVOICE_PAYMENT
  referenceId     String?  // Invoice ID if paying invoice
  
  createdAt       DateTime @default(now())
  paidAt          DateTime?
}
```

### Option B: Use `WalletTransaction` only
- Create `WalletTransaction` when webhook confirms `PAID`
- Store `cfOrderId` in `reference` field

---

## 5. Environment Variables

```env
# Cashfree Payments
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=sandbox   # or production
CASHFREE_WEBHOOK_SECRET=whsec_xxx   # From Cashfree Dashboard → Webhooks
```

---

## 6. Frontend Flow (Billing → Recharge)

1. User enters amount, clicks "Recharge via UPI/Card"
2. Frontend calls `POST /api/payments/create-order` with `{ amount, merchantId }`
3. Backend creates Cashfree order, returns `{ paymentSessionId }`
4. Frontend loads Cashfree Checkout.js and opens checkout:
   ```js
   const cashfree = Cashfree({ mode: "sandbox" });
   cashfree.checkout({ paymentSessionId });
   ```
5. On success, Cashfree redirects to `returnUrl` (e.g. `/dashboard/billing?status=success`)
6. Webhook runs in parallel – backend credits wallet
7. Billing page refetches wallet balance

---

## 7. Webhook Handler

- Cashfree sends `POST` to `https://your-api.com/api/payments/webhook`
- Verify signature using `CASHFREE_WEBHOOK_SECRET`
- On `order_status = PAID`:
  - Credit `Merchant.walletBalance`
  - Create `WalletTransaction` (type: RECHARGE)
  - Update `Payment` / mark order as paid
- Return 200 quickly; do heavy work async if needed

---

## 8. Cashfree Checkout.js

Add to `index.html` or Billing page:
```html
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
```

Or npm: `@cashfreepayments/cashfree-js`

---

## 9. Implementation Checklist

- [ ] Add Cashfree env vars to `.env.example` and Render
- [ ] Create `server/src/routes/payments.ts`
- [ ] Create `server/src/services/cashfree.ts`
- [ ] Add Payment model to Prisma (optional) or use WalletTransaction.reference
- [ ] Register webhook URL in Cashfree Dashboard
- [ ] Update `Billing.tsx` – replace mock recharge with real API + Cashfree checkout
- [ ] Add `billingApi` / `paymentsApi` to `src/lib/api.ts`
- [ ] Test in Sandbox with test UPI/cards

---

## 10. Cashfree Test Cards (Sandbox)

- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- UPI: `success@paytm` / `failure@paytm`

Docs: https://docs.cashfree.com/docs/testing-payments
