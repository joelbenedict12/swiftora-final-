import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { billingApi } from "@/lib/api";
import {
  Package,
  BarChart3,
  Truck,
  Wallet,
  Users,
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  X,
  FileText,
  ShoppingCart,
  MapPin,
  Plug,
  Shield,
  TrendingUp,
  CreditCard,
  Building2,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 60 * 1000; // Show warning 60s before logout

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [showB2BOnboarding, setShowB2BOnboarding] = useState(false);
  const [sessionWarningOpen, setSessionWarningOpen] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);
  const location = useLocation();

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (error: any) {
      const message = error?.message || "Failed to logout";
      toast.error(message);
    }
  };

  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearAllTimers();
    setSessionWarningOpen(false);

    warningTimer.current = setTimeout(() => {
      setSessionWarningOpen(true);
      setSessionCountdown(60);
      countdownInterval.current = setInterval(() => {
        setSessionCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    inactivityTimer.current = setTimeout(() => {
      setSessionWarningOpen(false);
      handleLogout();
      toast.error("Session expired due to inactivity");
    }, INACTIVITY_TIMEOUT);
  }, [clearAllTimers]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const onActivity = () => {
      if (!sessionWarningOpen) resetInactivityTimer();
    };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearAllTimers();
    };
  }, [resetInactivityTimer, clearAllTimers, sessionWarningOpen]);

  // Read user profile metadata from localStorage
  const storedProfile =
    typeof window !== "undefined"
      ? window.localStorage.getItem("swiftora_signup_profile")
      : null;
  const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
  const initialShippingType: "b2c" | "b2b" | "" =
    parsedProfile?.shippingType === "b2b" ||
      parsedProfile?.shippingType === "b2c"
      ? parsedProfile.shippingType
      : "b2c";

  const [shippingType] = useState<"b2c" | "b2b" | "">(initialShippingType);
  const [b2bEnabled, setB2bEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const onboarded =
      window.localStorage.getItem("swiftora_b2b_onboarded") === "true";
    return onboarded || initialShippingType === "b2b";
  });
  const [activeDashboard, setActiveDashboard] = useState<"b2c" | "b2b">(
    () => {
      if (typeof window === "undefined") return "b2c";
      const stored = window.localStorage.getItem("swiftora_active_dashboard");
      if (stored === "b2b" && (initialShippingType === "b2b")) {
        return "b2b";
      }
      return "b2c";
    }
  );

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics-reports",
      icon: TrendingUp,
    },
    { name: "Orders", href: "/dashboard/orders", icon: Package },
    { name: "Tracking", href: "/dashboard/tracking", icon: Truck },

    { name: "Billing & Wallet", href: "/dashboard/billing", icon: Wallet },
    { name: "Pickup Management", href: "/dashboard/pickup", icon: MapPin },
    {
      name: "Support & Disputes",
      href: "/dashboard/support",
      icon: HelpCircle,
    },
  ];

  const toolsNav = [
    {
      name: "Rate Calculator",
      href: "/dashboard/rate-calculator",
      icon: TrendingUp,
    },
    { name: "Rate Card", href: "/dashboard/rate-card", icon: FileText },
    {
      name: "Pincode Serviceability",
      href: "/dashboard/pincode-serviceability",
      icon: MapPin,
    },
    {
      name: "Restricted Items",
      href: "/dashboard/restricted-items",
      icon: Shield,
    },
    {
      name: "Terms & Conditions",
      href: "/dashboard/terms-and-conditions",
      icon: FileText,
    },
  ];

  // Wallet Balance (live from API)
  const [walletBalance, setWalletBalance] = useState({
    available: "₹0.00",
    pending: "₹0.00",
    total: "₹0.00",
  });

  useEffect(() => {
    billingApi.getWallet().then((res) => {
      const d = res.data;
      const fmt = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      setWalletBalance({
        available: fmt(d.balance),
        pending: fmt(d.creditLimit),
        total: fmt(d.availableBalance),
      });
    }).catch(() => {});
  }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleEnableB2B = () => {
    setShowB2BOnboarding(true);
  };

  const completeB2BOnboarding = () => {
    setB2bEnabled(true);
    setActiveDashboard("b2b");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("swiftora_b2b_onboarded", "true");
      window.localStorage.setItem("swiftora_active_dashboard", "b2b");
    }
    toast.success("B2B shipping enabled for your account.");
    setShowB2BOnboarding(false);
  };

  const handleDashboardSwitch = (mode: "b2c" | "b2b") => {
    if (mode === "b2b" && !b2bEnabled) {
      toast.error("Please complete B2B onboarding to access this dashboard.");
      return;
    }
    setActiveDashboard(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("swiftora_active_dashboard", mode);
    }
  };

  const handleRecharge = () => {
    setRechargeDialogOpen(false);
    navigate("/dashboard/billing");
  };

  // Filter navigation for B2C-only users (hide heavier B2B pages)
  const mainNavItems =
    b2bEnabled || shippingType === "b2b"
      ? navigation
      : navigation.filter((item) =>
        [
          "/dashboard",
          "/dashboard/orders",
          "/dashboard/tracking",
          "/dashboard/pickup",
          "/dashboard/billing",
        ].includes(item.href)
      );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Swiftora new logo */}
          <div className="flex items-center justify-between h-20 px-3 border-b border-gray-200 bg-white">
            <Link to="/dashboard" className="flex items-center justify-start min-w-0 flex-1">
              <img
                src="/resize-17712485012066810715swiftoranewlogo.jpeg"
                alt="Swiftora"
                className="h-16 w-auto object-contain object-left select-none"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-gray-100 text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            <div className="mb-6">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main
              </p>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1.5 group",
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive(item.href)
                          ? "text-blue-600"
                          : "text-gray-500 group-hover:text-blue-600"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="mb-6">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tools
              </p>
              {toolsNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1.5 group",
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive(item.href)
                          ? "text-blue-600"
                          : "text-gray-500 group-hover:text-blue-600"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role || "User"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>

            {/* Logout confirmation dialog */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            {b2bEnabled && (
              <div className="hidden md:flex items-center bg-gray-100 rounded-full p-0.5 mr-2">
                <button
                  type="button"
                  onClick={() => handleDashboardSwitch("b2c")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 transition-all ${activeDashboard === "b2c"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-700"
                    }`}
                >
                  <Package className="w-3 h-3" />
                  B2C
                </button>
                <button
                  type="button"
                  onClick={() => handleDashboardSwitch("b2b")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 transition-all ${activeDashboard === "b2b"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-slate-900"
                    }`}
                >
                  <Building2 className="w-3 h-3" />
                  B2B
                </button>
              </div>
            )}
            <div className="flex justify-end">
              <Link to="/dashboard/billing" className="group">
                <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg px-5 py-1.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all inline-flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">
                        Wallet Balance
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {walletBalance.available}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            <Button
              onClick={() => setRechargeDialogOpen(true)}
              className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
            >
              <CreditCard className="w-8 h-4 mr-2" />
              Wallet Recharge
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100 text-gray-600 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 text-gray-600 rounded-lg"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 bg-gray-50 min-h-screen space-y-4">
          {/* B2C-first CTA to enable B2B */}
          {shippingType === "b2c" && !b2bEnabled && location.pathname === "/dashboard" && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Need to ship in bulk or via GST invoicing?
                  </p>
                  <p className="text-xs text-slate-600">
                    Enable B2B Shipping to unlock enterprise workflows and compliance tools.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-black text-white text-xs"
                  onClick={handleEnableB2B}
                >
                  Enable B2B Shipping
                </Button>
              </div>
            </div>
          )}

          <Outlet context={{ activeDashboard }} />
        </main>

        <AlertDialog
          open={rechargeDialogOpen}
          onOpenChange={setRechargeDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Wallet Recharge</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the amount you want to add to your wallet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                id="recharge-amount"
                type="number"
                placeholder="₹ Amount"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRecharge}
                className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
              >
                Recharge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* B2B Onboarding Dialog */}
        <AlertDialog open={showB2BOnboarding} onOpenChange={setShowB2BOnboarding}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enable B2B Shipping</AlertDialogTitle>
              <AlertDialogDescription>
                Provide your company and GST details to unlock B2B dashboard and consignment tools.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
              <Input id="b2b-company" placeholder="Company Name" className="text-sm" />
              <Input id="b2b-gstin" placeholder="GSTIN (e.g., 27AAAAA0000A1Z5)" className="text-sm" />
              <Input id="b2b-warehouse" placeholder="Primary Pickup Warehouse" className="text-sm" />
              <Input
                id="b2b-compliance"
                placeholder="Invoice & compliance contact / notes (optional)"
                className="text-sm"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={completeB2BOnboarding}
                className="bg-slate-900 hover:bg-black text-white"
              >
                Enable B2B
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Session Expiring Warning */}
        <AlertDialog open={sessionWarningOpen} onOpenChange={(open) => {
          if (!open) {
            resetInactivityTimer();
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Session Expiring</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out in {sessionCountdown} seconds due to inactivity.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => resetInactivityTimer()}>
                Stay Logged In
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster richColors />
      </div>
    </div>
  );
};

export default DashboardLayout;
