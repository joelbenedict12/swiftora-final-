## Swiftora – Product Requirements Document (PRD)

**Version**: 1.0  
**Last Updated**: 04 March 2026  
**Project**: Swiftora – Unified Logistics Aggregation Platform for Indian E‑Commerce  
**Intended Use**: This PRD is written in a **report‑friendly format** so it can be directly reused as core material for an internship / academic report.

---

### 1. Introduction

#### 1.1 Background & Premise

Indian e‑commerce and D2C (direct‑to‑consumer) brands rely heavily on parcel logistics to serve customers across metros, Tier‑2/3 cities, and remote locations. Most merchants work with multiple courier partners (Delhivery, Ekart, Xpressbees, etc.) to balance costs, service levels, and coverage.

Managing these relationships manually leads to:

- Fragmented shipping workflows across courier dashboards  
- Manual rate comparison and courier selection  
- Poor visibility into shipment status across carriers  
- Complex cash‑on‑delivery (COD) reconciliation  
- Limited analytics on logistics performance and costs

**Swiftora** addresses this gap by acting as a **unified logistics aggregation platform**. It centralizes order creation, courier selection, tracking, COD remittance, NDR and returns handling, and analytics into a single interface.

#### 1.2 Purpose of This Document

This Product Requirements Document (PRD) captures the **business context, functional requirements, non‑functional requirements, system design, and user journeys** for Swiftora.

It is intentionally **detailed and structured** to:

- Serve as a **primary reference** for the internship / academic report.  
- Provide a clear view of how the Swiftora frontend (React + Vite + shadcn‑ui) interacts with the backend APIs.  
- Help evaluators understand the **problem, solution, architecture, and scope** of the project.

#### 1.3 Product Vision

> **“One platform to manage every courier, automate shipping decisions, and give Indian businesses end‑to‑end visibility into logistics, COD, and performance.”**

Swiftora should:

- Act as a **single control panel** for all shipping and logistics operations.  
- Automatically choose optimal couriers based on cost, SLA, and serviceability.  
- Provide **real‑time tracking** and customer communication.  
- Simplify **COD remittance, billing, and settlements**.  
- Offer actionable **analytics and reporting** for merchants and admins.

#### 1.4 Scope

In this iteration, Swiftora includes:

- **Public marketing website** (landing page, about, contact, policies).  
- **Merchant dashboard** for shipping operations.  
- **Admin portal** for platform‑level management and analytics.  
- **Support portal** for ticket and issue management.  
- **API integrations** with multiple courier partners and Shopify.  
- **Operational features**: order creation, pickups, tracking, serviceability, rate calculation, COD remittance, NDR, reverse shipments, billing, and analytics.

Out of scope for this version:

- Native mobile apps.  
- International shipping flows.  
- Deep AI‑based routing beyond rule‑based and integration‑driven logic.

#### 1.5 Definitions & Acronyms

- **COD** – Cash on Delivery  
- **NDR** – Non‑Delivery Report (failed/attempted deliveries)  
- **RTO** – Return To Origin  
- **AWB** – Air Waybill (shipment tracking number)  
- **KYC** – Know Your Customer (compliance verification)  
- **D2C** – Direct‑to‑Consumer

---

### 2. Stakeholders & User Personas

#### 2.1 Stakeholders

- **Merchant / Seller** – E‑commerce/D2C brand using Swiftora for shipping.  
- **Operations Manager** – Manages daily order processing, pickups, and issue resolution.  
- **Finance / Accounts Team** – Reconciles COD payouts and logistics costs.  
- **Support Team** – Handles tickets related to delivery issues, billing disputes, courier escalations.  
- **Platform Admin** – Manages platform configuration, vendors, rate cards, and analytics.  
- **Courier Partners** – Integrated logistics providers (Delhivery, Ekart, Xpressbees, Innofulfill, etc.).  
- **Technology Team** – Developers maintaining the frontend and backend systems.

#### 2.2 User Personas

1. **Merchant Owner (Small Brand)**
   - Needs an easy way to ship orders across India, with minimal manual work.
   - Cares about cost, COD remittance speed, and visibility into delivery performance.

2. **Ops Executive (Mid‑size Brand)**
   - Works inside the dashboard daily.
   - Creates orders, schedules pickups, monitors tracking, handles NDR/RTO, and updates customers.

3. **Platform Administrator**
   - Manages vendors, rate cards, wallets, invoices, integrations, and platform settings.
   - Needs comprehensive analytics across all merchants.

4. **Support Agent**
   - Works in a dedicated support panel.
   - Handles tickets related to deliveries, damages, disputes, and escalations.

---

### 3. System Overview

#### 3.1 High‑Level Concept

Swiftora sits **between merchants, sales channels, and multiple courier partners**:

- **Inputs**:
  - Orders from merchants (manual entry or integrations like Shopify).
  - Configuration: warehouses, rate preferences, courier accounts, rules.
- **Processing**:
  - Serviceability checks and rate calculations.
  - Courier selection and shipment creation through courier APIs.
  - Tracking updates, NDR and reverse shipment workflows.
  - Wallet, billing, COD remittance, and analytics computations.
- **Outputs**:
  - Shipping labels and pickup schedules.
  - Unified tracking views and status updates.
  - COD settlement details, invoices, and financial reports.

#### 3.2 Major Modules (Functional View)

- **Public Website**
  - Landing (`Index`), About, Contact, Tracking, Terms & Policies.
- **Merchant Dashboard**
  - Overview dashboard, Orders, Create Order, Tracking, Pickups, Billing, Analytics, Serviceability, Rate Calculator, COD Remittance, NDR, Reverse, Settings.
- **Admin Portal**
  - Admin Dashboard, Vendors, Users, Orders, Payments, Rate Cards, Invoices, Settings, Analytics.
- **Support Portal**
  - Ticket list, ticket details, notes, status management.
- **Integrations**
  - Shopify sync, courier integrations (Delhivery, Ekart, Xpressbees, Innofulfill), KYC verification.

#### 3.3 Technology Stack (Implementation View)

- **Frontend**
  - React 18 + TypeScript
  - Vite (build tool)
  - shadcn‑ui + Radix UI + Tailwind CSS for design system
  - React Router DOM for routing
  - @tanstack/react‑query for data fetching & caching
  - Zustand for auth/session state (via `auth-storage`)

- **Backend (from `server/src`)**
  - Node.js + Express (REST APIs)
  - Prisma ORM (relational database; e.g. PostgreSQL)
  - Courier‑specific services (Delhivery, Ekart, Xpressbees, Innofulfill)
  - Wallet, billing, invoice generation (including PDF)
  - KYC integration (Didit)
  - Support and admin endpoints

- **External Services**
  - Courier APIs (shipping, pricing, serviceability, tracking, pickups)
  - Shopify API (order sync)
  - Payment gateway / QR‑based payments (via `cashfree` and wallet APIs)

---

### 4. Functional Requirements

> Note: IDs like **FR‑x.y‑z** are provided so they can be referenced easily in your report.

#### 4.1 Authentication & Access Control

- **FR‑1.1** – The system shall provide user registration with fields: name, email, phone, password, optional company name.  
- **FR‑1.2** – The system shall provide login with email and password, issuing a JWT token stored via frontend auth storage.  
- **FR‑1.3** – The system shall support logout and token refresh flows.  
- **FR‑1.4** – The system shall provide “Forgot Password” and “Reset Password” flows using an emailed token.  
- **FR‑1.5** – The system shall maintain role‑based access control, at minimum:
  - Merchant
  - Admin
  - Support
- **FR‑1.6** – Unauthorized access (HTTP 401) shall automatically log the user out and redirect to the login page.

#### 4.2 Public Website

- **FR‑2.1** – The landing page shall describe Swiftora’s value proposition as a **unified logistics aggregator** for Indian businesses.  
- **FR‑2.2** – The landing page shall highlight:
  - Multi‑courier integration  
  - Automated shipping rules  
  - Real‑time tracking  
  - NDR & returns management  
  - Analytics dashboard  
  - COD reconciliation
- **FR‑2.3** – The public site shall include:
  - About page  
  - Contact page  
  - Public tracking page (track order by order number / AWB / phone)  
  - Terms & Conditions, Privacy Policy, Refund Policy pages.
- **FR‑2.4** – The primary CTA on the homepage shall route to login/onboarding to start shipping.

#### 4.3 Merchant Dashboard Overview

- **FR‑3.1** – The dashboard home shall display key stats:
  - Total orders  
  - Today’s orders  
  - In‑transit orders  
  - Delivered orders  
  - Out‑for‑pickup orders  
  - RTO cases  
  - Total pickups  
  - Pending pickups
- **FR‑3.2** – The dashboard shall show an orders trends chart for a period (e.g. last 7 days).  
- **FR‑3.3** – The dashboard shall list **recent orders** with status, destination, AWB, payment mode, and value.  
- **FR‑3.4** – The dashboard shall display **upcoming pickups** with warehouse, courier, date, time slot, and order counts.  
- **FR‑3.5** – Quick actions shall be available:
  - Create Order  
  - View All Orders  
  - Track Shipment

#### 4.4 Order Management & Shipping

- **FR‑4.1** – Merchants shall be able to **create orders** with:
  - Customer details (name, phone, optional email)  
  - Full shipping address (address, city, state, pincode, landmark)  
  - Product details (name, value, quantity)  
  - Shipment details (weight, dimensions, B2B flag, GST number, invoice number)  
  - Payment mode (Prepaid / COD with COD amount)  
  - Warehouse selection  
  - Optional channel and notes
- **FR‑4.2** – The system shall validate required fields and show contextual error messages.  
- **FR‑4.3** – Merchants shall list orders with filters for:
  - Status (pending, manifested, in transit, delivered, RTO, etc.)  
  - Date ranges  
  - Search by order number, customer name, phone, or AWB.
- **FR‑4.4** – The system shall support **bulk import** of orders via file upload.  
- **FR‑4.5** – The system shall allow cancelling an order before shipment is created.  
- **FR‑4.6** – For each order, the system shall expose operations:
  - View details  
  - Assign pickup warehouse  
  - Generate rate and serviceability checks  
  - Ship via a specific courier  
  - Download shipping label (4R or A4)  
  - Sync shipment status

#### 4.5 Courier Aggregation & Routing

- **FR‑5.1** – The system shall integrate at least the following couriers:
  - Delhivery  
  - Ekart  
  - Xpressbees  
  - Innofulfill  
  - (Extensible for additional couriers)
- **FR‑5.2** – The system shall provide a common API to **ship an order** by passing a courier name, hiding courier‑specific implementation details.  
- **FR‑5.3** – The system shall fetch **pricing** from courier‑specific APIs (e.g. Delhivery/Xpressbees pricing endpoints) and present them to the merchant.  
- **FR‑5.4** – The system shall allow selecting a courier service (standard/express/etc.) based on returned pricing and service level data.  
- **FR‑5.5** – The system shall abstract courier‑specific label generation and expose a unified endpoint to download A4 shipping labels.  
- **FR‑5.6** – The system shall support creating courier pickups (e.g. Delhivery pickup booking) with warehouse, date, time, and package count.

#### 4.6 Tracking & Serviceability

- **FR‑6.1** – The system shall expose a **tracking API** that supports:
  - Tracking by AWB  
  - Tracking by order ID  
  - Tracking by phone (where applicable)
- **FR‑6.2** – The merchant dashboard shall provide a **Tracking** page that visualizes:
  - Current order status  
  - Courier milestones via timeline components  
  - Courier‑specific tracking widgets (Delhivery, Ekart, Xpressbees, Innofulfill, Blitz, etc. where available).
- **FR‑6.3** – The system shall support **pincode serviceability checks** via the `/serviceability` APIs:
  - Single pincode checks  
  - Bulk pincode checks
- **FR‑6.4** – The **Rate Calculator** module shall allow users to input:
  - Origin pincode  
  - Destination pincode  
  - Weight  
  - Payment mode (prepaid / COD)  
  and receive calculated rates from integrated couriers.

#### 4.7 Pickups Management

- **FR‑7.1** – The system shall allow merchants to **schedule pickups** with:
  - Warehouse  
  - Date & time / time slot  
  - Courier name  
  - Expected package count  
  - Optional notes
- **FR‑7.2** – The system shall list pickups with status (scheduled, in progress, completed, cancelled).  
- **FR‑7.3** – The dashboard shall summarize pickups for the next days and show order counts vs expected pickups.  
- **FR‑7.4** – Merchants shall be able to cancel a pickup subject to courier constraints.

#### 4.8 Billing, Wallet & Invoices

- **FR‑8.1** – Each merchant shall have a **wallet** balance used for shipping charges and adjustments.  
- **FR‑8.2** – The system shall provide APIs to:
  - Fetch wallet balance and recent transactions  
  - Recharge the wallet via payment gateway/QR payment  
  - Submit a QR payment reference (UTR)  
  - Check payment status
- **FR‑8.3** – The merchant dashboard shall list **invoices** and allow downloading invoice PDFs.  
- **FR‑8.4** – The admin panel shall:
  - Generate invoices (per merchant, monthly)  
  - Mark invoices as paid  
  - Verify wallet balances  
  - Approve/reject pending QR payments.

#### 4.9 COD Remittance

- **FR‑9.1** – The system shall track **COD remittance entries** per merchant and per courier.  
- **FR‑9.2** – Vendor‑side views shall show:
  - COD receivables  
  - Status (pending, received, paid)  
  - Courier charges and platform fees
- **FR‑9.3** – Admin views shall allow:
  - Viewing aggregated COD remittance items  
  - Marking amounts as received from couriers  
  - Marking payouts as paid to merchants, with optional transaction/reference IDs.

#### 4.10 NDR (Non‑Delivery Report) & RTO Management

- **FR‑10.1** – The system shall pull NDR data from couriers (e.g. Xpressbees NDR APIs).  
- **FR‑10.2** – The merchant shall view NDR cases categorized by courier, reason, and status (open, in progress, resolved).  
- **FR‑10.3** – The system shall allow taking NDR actions such as:
  - Re‑attempt delivery  
  - Change address  
  - Change phone number  
  with payloads passed back to courier APIs where supported.
- **FR‑10.4** – RTO rates and counts shall be visible on the dashboard and analytics reports.

#### 4.11 Reverse Shipments (Returns)

- **FR‑11.1** – The system shall allow initiating **reverse shipments** for delivered orders with:
  - Reason for return  
  - Optional new pickup address and phone  
  - QC requirement flag  
  - Optional preferred pickup date
- **FR‑11.2** – Reverse shipments shall be tracked with statuses and visible on appropriate lists.  
- **FR‑11.3** – The system shall allow cancelling reverse shipments if not yet processed.

#### 4.12 Analytics & Reporting

- **FR‑12.1** – The merchant dashboard shall show analytics for:
  - Order volumes over time  
  - Delivered vs in‑transit vs RTO  
  - Basic revenue estimates
- **FR‑12.2** – The admin portal shall provide more advanced analytics:
  - Profit & loss analytics per period  
  - Courier distribution (share per courier)  
  - Top customers / merchants  
  - Vendor‑level analytics (delivery performance, wallet usage, etc.).

#### 4.13 Admin Portal

- **FR‑13.1** – Admins shall access a dedicated UI under `/admin`.  
- **FR‑13.2** – Admins shall manage:
  - Users and roles  
  - Vendors (merchants) and their customer type (cash/credit, credit limits)  
  - Wallets and transactions  
  - Rate cards per courier and account type  
  - Platform settings (commission %, minimum recharge, QR URL, QC charges)  
  - Invoices and monthly billing  
  - Pending QR payments and approvals  
  - Global orders across merchants  
  - Assigning tickets to support users.

#### 4.14 Support Portal

- **FR‑14.1** – Support users shall sign into a separate **Support layout** under `/support`.  
- **FR‑14.2** – The support dashboard shall summarize open tickets by status and priority.  
- **FR‑14.3** – Support users shall:
  - View ticket lists filtered by status, priority, and type.  
  - View ticket details and linked order or merchant where applicable.  
  - Update ticket status (open, in progress, resolved, closed).  
  - Add internal or external notes to tickets.

#### 4.15 Integrations

- **FR‑15.1** – Shopify integration shall:
  - Expose a status endpoint  
  - Connect/disconnect a Shopify store  
  - Synchronize orders from Shopify into Swiftora  
  - Configure auto‑fulfillment preferences.
- **FR‑15.2** – Integrations with marketplaces / OMS platforms (e.g. Unicommerce, EasyEcom) shall be supported via UI marketing and extendable APIs.  
- **FR‑15.3** – KYC integration (Didit) shall:
  - Show current KYC status  
  - Allow creating a KYC session with extended timeout handling.

---

### 5. Non‑Functional Requirements

#### 5.1 Performance

- **NFR‑1.1** – Most dashboard pages shall load within **2–3 seconds** on a typical broadband connection.  
- **NFR‑1.2** – API responses for standard reads (orders list, pickups, dashboard overview) should complete within **< 1 second** under normal load.  
- **NFR‑1.3** – Heavy operations (invoice generation, analytics computation, KYC session creation) may take longer but should provide user feedback (loading indicators).

#### 5.2 Reliability & Availability

- **NFR‑2.1** – The system should be available **24/7** except for planned maintenance windows.  
- **NFR‑2.2** – Courier or external service failures shall be handled gracefully with user‑visible error messages and retry options.  
- **NFR‑2.3** – Background tasks (status sync, analytics, invoice generation) should be idempotent to avoid data duplication.

#### 5.3 Security

- **NFR‑3.1** – All communication between frontend and backend shall be over HTTPS.  
- **NFR‑3.2** – JWT tokens shall be validated on each request; invalid/expired tokens result in logout.  
- **NFR‑3.3** – Role‑based access control must ensure that:
  - Merchants see only their own data.  
  - Admins and support users access only appropriate scopes.  
- **NFR‑3.4** – Sensitive operations (wallet credits, invoice status changes, COD remittance changes) shall be authorized only for admins.  
- **NFR‑3.5** – KYC and financial data must be stored and accessed securely, following best practices for data protection in India.

#### 5.4 Usability & UX

- **NFR‑4.1** – The UI should follow a modern design language with consistent typography, spacing, and components (shadcn‑ui).  
- **NFR‑4.2** – Primary flows (create order, schedule pickup, track shipment) should be achievable in **< 3–4 clicks** from the dashboard.  
- **NFR‑4.3** – The product should be usable on desktop and laptop resolutions; mobile responsiveness is desirable but not critical in this version.

#### 5.5 Scalability & Extensibility

- **NFR‑5.1** – The architecture should support adding new couriers by implementing courier‑specific services and wiring them into the common API surface.  
- **NFR‑5.2** – The platform should scale to **thousands of orders per day** across multiple merchants.  
- **NFR‑5.3** – Integrations with new sales channels or OMS platforms should be possible without major frontend refactoring.

---

### 6. System Design Overview

#### 6.1 Frontend Architecture

- **Routing Layer** – Implemented via `react-router-dom`:
  - Public routes: `/`, `/about`, `/contact`, `/tracking`, `/terms-and-conditions`, `/privacy-policy`, `/refund-policy`, etc.  
  - Merchant routes under `/dashboard` (nested within `DashboardLayout`, protected by `ProtectedRoute`).  
  - Admin routes under `/admin` using `AdminLayout`.  
  - Support routes under `/support` using `SupportLayout`.

- **State Management**
  - Authentication and user session managed via Zustand store (persisted to `auth-storage` in localStorage).  
  - Server state handled through React Query (`QueryClientProvider`) for caching, refetching, and synchronization.

- **UI Components**
  - Reusable layouts for dashboard, admin, support.  
  - UI components from shadcn‑ui (cards, tables, accordions, dialogs, toasts, tooltips).  
  - Charts built with Recharts (for analytics views).  
  - Tracking timelines and courier‑specific trackers as dedicated components.

#### 6.2 Backend Architecture (High‑Level)

- **API Layer**
  - REST endpoints for auth, orders, pickups, tracking, serviceability, rates, billing, admin, support, analytics, COD, NDR, reverse, warehouses, integrations, KYC.

- **Service Layer**
  - Courier services (Delhivery, Ekart, Xpressbees, Innofulfill, Blitz).  
  - Pricing engine service (rate calculations and margin application).  
  - Invoice service (PDF generation and billing periods).  
  - Wallet service (credits, debits, verification).  
  - Analytics and profit service.  
  - Reverse and NDR services.  
  - Shopify and other integration services.

- **Data Layer**
  - Prisma ORM manages interactions with a relational database (e.g., PostgreSQL).  
  - Entities such as users, merchants, warehouses, orders, shipments, invoices, wallets, transactions, COD remittances, tickets, and integration settings are persisted.

#### 6.3 Key Entity Overview (Conceptual)

This is a conceptual view to support your report, not a full schema.

- **User**
  - id, name, email, phone, password hash  
  - role (MERCHANT, ADMIN, SUPPORT)  
  - merchantId (for merchant users)

- **Merchant / Vendor**
  - id, companyName, contact details  
  - customerType (CASH / CREDIT)  
  - creditLimit, isPaused flags  
  - KYC status

- **Warehouse**
  - id, merchantId, name, address, pincode, city, state  
  - links to courier‑specific warehouse identifiers (e.g. Delhivery).

- **Order**
  - id, merchantId, warehouseId  
  - orderNumber, channel, paymentMode, productValue, codAmount  
  - customer details and shipping address  
  - status (pending, manifested, in transit, delivered, RTO, cancelled, etc.)  
  - courierName, AWB, label references  
  - timestamps for creation, shipment, delivery.

- **Pickup**
  - id, merchantId, warehouseId  
  - scheduledDate, timeSlot, courierName, expectedPackageCount  
  - status (scheduled, in progress, completed, cancelled).

- **Wallet & Transactions**
  - Wallet: merchantId, balance.  
  - WalletTransaction: id, walletId, amount, type (CREDIT/DEBIT), description, reference.

- **Invoice**
  - id, merchantId, period (month/year)  
  - amount, status (pending/paid), PDF URL or blob reference.

- **COD Remittance**
  - id, merchantId, courierName  
  - totalCodAmount, courierCharges, platformFee, status (pending/received/paid)  
  - references to settlement/transaction IDs.

- **NDR Case**
  - id, orderId, courierName, reason, status, actions taken.

- **Reverse Shipment**
  - id, orderId, reason, qcRequired, status, pickup details.

- **Ticket**
  - id, merchantId (optional), orderId (optional)  
  - type (delivery issue, weight dispute, lost/damaged, etc.)  
  - subject, description, priority, status, assignedTo, resolution.

---

### 7. User Journeys

#### 7.1 Merchant Onboarding & Login

1. Merchant visits the public site and clicks **Start Shipping**.  
2. Merchant registers with email, phone, password, and company name.  
3. Merchant verifies email (where applicable) and logs in.  
4. Merchant completes basic setup: warehouses, courier integrations, billing details.  
5. From then on, merchant uses the `/dashboard` area for daily operations.

#### 7.2 Create & Ship an Order

1. Merchant navigates to **Create Order** in the dashboard.  
2. Fills in customer and shipment details, selects warehouse and payment mode.  
3. Optionally checks rate and serviceability for destination pincode.  
4. Saves the order; the order appears in pending/ready‑to‑ship status.  
5. Merchant chooses a courier (or uses automated rules), triggers **Ship**.  
6. The system calls courier APIs, gets AWB and label; order status becomes `IN_TRANSIT`/equivalent.  
7. Merchant prints and attaches label; shipment is picked up by courier.

#### 7.3 Track Shipments

1. Merchant visits **Tracking** in the dashboard.  
2. Searches by order number, AWB, or customer phone.  
3. UI shows a unified timeline with courier events and latest status.  
4. Customers may also track via public `/tracking` using order number or AWB.

#### 7.4 Handle NDR / Failed Deliveries

1. NDR list shows orders where delivery failed.  
2. Merchant opens a case to see the reason.  
3. Merchant chooses an action: re‑attempt, change address, or change phone.  
4. Swiftora sends the chosen action to the courier via NDR API (where supported).  
5. Status updates reflect in NDR list and overall order status.

#### 7.5 COD Remittance & Billing

1. Merchant opens **Billing/COD Remittance**.  
2. Views outstanding COD amounts per courier and per period.  
3. After courier remits COD, admin marks amounts as **Received** and then **Paid** to merchant.  
4. Merchant sees settled and outstanding balances, wallet transactions, and invoices.  
5. Finance team uses invoice PDFs and transaction lists for accounting.

#### 7.6 Admin & Support Workflows

- **Admin**
  - Monitors platform‑wide stats from the admin dashboard.  
  - Manages vendors, rate cards, invoices, wallets, and pending payments.  
  - Adjusts global platform settings (commission, QR URLs, etc.).

- **Support**
  - Views support dashboard summarizing tickets.  
  - Picks tickets, updates status, and adds notes.  
  - Works with courier and merchants to resolve issues and closes tickets.

---

### 8. Risks, Assumptions & Dependencies

#### 8.1 Assumptions

- Merchants have stable internet connectivity.  
- Courier partner APIs are available, correctly documented, and stable.  
- Settlement and invoicing rules follow standard practices for Indian logistics and COD.  
- The database and infrastructure can handle anticipated traffic for pilot deployments.

#### 8.2 Risks

- **R‑1** – Courier API changes may break integrations.  
  - *Mitigation*: Isolate courier integrations in dedicated services and handle errors gracefully.

- **R‑2** – Delays in COD remittance from couriers affect merchant cash flow.  
  - *Mitigation*: Provide transparent visibility and notifications on expected and actual remittances.

- **R‑3** – Incorrect configuration (rate cards, warehouses) could cause cost or SLA issues.  
  - *Mitigation*: Provide validation, test tools, and clear admin UI for configuration.

- **R‑4** – Large data volumes for analytics may lead to slow queries.  
  - *Mitigation*: Add indexes, caching, and pre‑computed analytics where required.

---

### 9. Testing & Quality

#### 9.1 Testing Types

- **Unit Testing** – For utility functions, services, and API handlers.  
- **Integration Testing** – For flows across backend modules (orders + couriers + billing).  
- **End‑to‑End (E2E) Testing** – For critical UI flows:
  - Login, create order, ship, track  
  - Schedule pickup  
  - View analytics  
  - Admin invoice generation  
  - Support ticket lifecycle
- **Performance Testing** – For rate calculation, dashboard overview, and bulk imports.  
- **UAT (User Acceptance Testing)** – With sample merchants to validate usability and correctness.

#### 9.2 Sample Test Scenarios (High‑Level)

- Create prepaid and COD orders, verify wallet/billing behavior.  
- Ship orders with multiple couriers and verify labels and tracking links.  
- Reject/approve QR payments and verify wallet balances.  
- Generate monthly invoices and verify amounts and statuses.  
- Initiate reverse shipments and verify statuses.  
- Create NDR cases and test supported actions.

---

### 10. Future Enhancements

- **AI‑Driven Courier Selection & RTO Prediction**
  - Use ML models to predict best courier based on historical performance and to estimate RTO risk.

- **Deeper Customer Communication**
  - Native WhatsApp templates for shipment updates.  
  - Branded tracking pages per merchant.

- **Mobile Apps**
  - iOS/Android applications for warehouse staff and merchants on the go.

- **International Shipping**
  - Support cross‑border shipping with duties, customs documentation, and currency conversion.

- **Advanced Analytics**
  - Cohort analysis for customer delivery experience.  
  - Margin and cost breakdown per product/category and per region.

---

### 11. Conclusion

This PRD defines **Swiftora** as a comprehensive, production‑grade **logistics aggregation platform** tailored to Indian e‑commerce businesses. It consolidates multiple couriers, serviceability checks, tracking, COD remittance, returns management, billing, and analytics into a unified system.

The detailed requirements, system design, and user journeys outlined here are intentionally structured so they can be **directly reused** in an internship or academic report, with minimal additional work beyond adding screenshots, implementation details, and personal reflections.

