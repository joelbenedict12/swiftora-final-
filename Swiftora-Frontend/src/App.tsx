import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Tracking from "./pages/Tracking";
import Contact from "./pages/Contact";
import TermsAndConditionsPublic from "./pages/TermsAndConditionsPublic";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Orders from "./pages/dashboard/Orders";
import Analytics from "./pages/dashboard/Analytics";
import Billing from "./pages/dashboard/Billing";
import TrackingDashboard from "./pages/dashboard/Tracking";
import Pickup from "./pages/dashboard/Pickup";
import Support from "./pages/dashboard/Support";
import Settings from "./pages/dashboard/Settings";
import CreateOrder from "./pages/dashboard/CreateOrder";
import RateCalculator from "./pages/dashboard/RateCalculator";
import RateCard from "./pages/dashboard/RateCard";
import PincodeServiceability from "./pages/dashboard/PincodeServiceability";
import RestrictedItems from "./pages/dashboard/RestrictedItems";
import RTOPredictor from "./pages/dashboard/RTOPredictor";
import TermsAndConditions from "./pages/dashboard/TermsAndConditions";
import Remittance from "./pages/dashboard/Remittance";
import AnalyticsReports from "./pages/dashboard/AnalyticsReports";
import BusinessSuccessRate from "./pages/dashboard/BusinessSuccessRate";
import AllProducts from "./pages/dashboard/AllProducts";
import Services from "./pages/dashboard/Services";
import NotFound from "./pages/NotFound";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminVendors from "./pages/admin/Vendors";
import AdminOrders from "./pages/admin/Orders";
import AdminTickets from "./pages/admin/Tickets";
import AdminPayments from "./pages/admin/Payments";
import AdminSettings from "./pages/admin/Settings";
import AdminIntegrations from "./pages/admin/Integrations";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminRateCards from "./pages/admin/RateCards";
import AdminInvoices from "./pages/admin/Invoices";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPublic />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<CreateOrder />} />
            <Route path="create-order" element={<CreateOrder />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="analytics-reports" element={<AnalyticsReports />} />
            <Route path="billing" element={<Billing />} />
            <Route path="tracking" element={<TrackingDashboard />} />
            <Route path="pickup" element={<Pickup />} />
            <Route path="support" element={<Support />} />
            <Route path="settings" element={<Settings />} />
            <Route path="services" element={<Services />} />
            <Route path="settings/users" element={<Settings />} />
            <Route path="settings/courier" element={<Settings />} />
            <Route path="settings/integrations" element={<Settings />} />
            <Route path="settings/notifications" element={<Settings />} />
            <Route path="settings/automation" element={<Settings />} />
            <Route path="settings/security" element={<Settings />} />
            <Route path="settings/tax" element={<Settings />} />
            <Route path="settings/bank" element={<Settings />} />
            <Route path="settings/invoices" element={<Settings />} />
            <Route path="rate-calculator" element={<RateCalculator />} />
            <Route path="rate-card" element={<RateCard />} />
            <Route
              path="pincode-serviceability"
              element={<PincodeServiceability />}
            />
            <Route path="restricted-items" element={<RestrictedItems />} />
            <Route path="rto-predictor" element={<RTOPredictor />} />
            <Route
              path="terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="remittance" element={<Remittance />} />
            <Route
              path="business-success-rate"
              element={<BusinessSuccessRate />}
            />
            <Route path="all-products" element={<AllProducts />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="integrations" element={<AdminIntegrations />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="rate-cards" element={<AdminRateCards />} />
            <Route path="invoices" element={<AdminInvoices />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
