import { useState, useEffect } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
interface CardType {
  title: string;
  value: string;
  info: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import IndiaShipmentMap from "@/components/IndiaShipmentMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Truck,
  Activity,
  Users,
  Settings,
  Bell,
  Calendar,
  FileText,
  ShoppingCart,
  Wallet,
  RefreshCw,
  AlertTriangle,
  ClipboardList,
  CalendarClock,
  AlertCircle,
  FileDown,
  MoreHorizontal,
  Building2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import IndiaCoverageMap from "@/components/IndiaCoverageMap";
import { dashboardApi, ordersApi, pickupsApi } from "@/lib/api";

type DashboardOutletContext = { activeDashboard: "b2c" | "b2b" };

const Dashboard = () => {
  const { activeDashboard } = useOutletContext<DashboardOutletContext>();
  const isB2B = activeDashboard === "b2b";
  const [dateRange, setDateRange] = useState("7d");
  const navigate = useNavigate();
  
  // Real API Data State
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentPickups, setRecentPickups] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Load Dashboard Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsRes, analyticsRes, ordersRes, pickupsRes] = await Promise.all([
          dashboardApi.overview(),
          dashboardApi.analytics({ period: '7d' }),
          ordersApi.list({ limit: 5, page: 1 }),
          pickupsApi.list(),
        ]);
        
        setDashboardStats(statsRes.data);
        setChartData(analyticsRes.data?.data || []);
        setRecentOrders(ordersRes.data?.orders?.slice(0, 5) || []);
        setRecentPickups(pickupsRes.data?.pickups?.slice(0, 5) || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRange]);
  
  // Load user preferences from localStorage
  const loadPreference = (key: string, defaultValue: boolean) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`swiftora_dashboard_${key}`);
      return saved !== null ? saved === "true" : defaultValue;
    }
    return defaultValue;
  };

  const savePreference = (key: string, value: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`swiftora_dashboard_${key}`, value.toString());
    }
  };

  // Collapsible states for sections with localStorage persistence
  const [operationsExpanded, setOperationsExpanded] = useState(() =>
    loadPreference("operations_expanded", true)
  );
  const [pickupOperationsExpanded, setPickupOperationsExpanded] = useState(() =>
    loadPreference("pickup_operations_expanded", true)
  );
  const [discoveryExpanded, setDiscoveryExpanded] = useState(() =>
    loadPreference("discovery_expanded", false)
  );

  // Save preferences when states change
  useEffect(() => {
    savePreference("operations_expanded", operationsExpanded);
  }, [operationsExpanded]);

  useEffect(() => {
    savePreference("pickup_operations_expanded", pickupOperationsExpanded);
  }, [pickupOperationsExpanded]);


  useEffect(() => {
    savePreference("discovery_expanded", discoveryExpanded);
  }, [discoveryExpanded]);
  
  // Track expanded warehouses for pickups
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<string>>(new Set());
  
  const toggleWarehouse = (warehouse: string) => {
    setExpandedWarehouses((prev) => {
      const next = new Set(prev);
      if (next.has(warehouse)) {
        next.delete(warehouse);
      } else {
        next.add(warehouse);
      }
      return next;
    });
  };
  
  // Sort pickups by priority: Out for Pickup > Failed > Scheduled > Picked
  const sortPickupsByPriority = (pickups: typeof scheduledPickups) => {
    const priority: Record<string, number> = {
      "Out for Pickup": 1,
      "Failed": 2,
      "Scheduled": 3,
      "Picked": 4,
    };
    return [...pickups].sort((a, b) => {
      const aPriority = priority[a.status] || 99;
      const bPriority = priority[b.status] || 99;
      return aPriority - bPriority;
    });
  };

  const handleSearchOrders = () => {
    toast.info("Search orders - Navigate to Orders page");
  };

  const handleFilterOrders = () => {
    toast.info("Filter orders - Navigate to Orders page");
  };

  const handleSyncOrders = () => {
    toast.info("Syncing orders from vendors...");
    // Simulate sync process
    setTimeout(() => {
      toast.success("Orders synced successfully from all vendors!");
    }, 2000);
  };

  // Action Required Data
  const actionRequiredItems = [
    {
      id: "high-rto-risk",
      title: "High RTO Risk",
      count: 12,
      description: "Orders with high return-to-origin probability",
      cta: "Fix Now",
      icon: AlertTriangle,
      color: "red",
      link: "/dashboard/orders?filter=rto-risk",
    },
    {
      id: "address-errors",
      title: "Address Errors",
      count: 8,
      description: "Incomplete or invalid delivery addresses",
      cta: "Fix Now",
      icon: MapPin,
      color: "yellow",
      link: "/dashboard/orders?filter=address-errors",
    },
    {
      id: "pending-manifest",
      title: "Pending Manifest",
      count: 3,
      description: "Manifests awaiting submission to couriers",
      cta: "Act Now",
      icon: ClipboardList,
      color: "yellow",
      link: "/dashboard/orders?filter=pending-manifest",
    },
    {
      id: "pending-pickups",
      title: "Pending Pickups",
      count: 5,
      description: "Scheduled pickups requiring confirmation",
      cta: "Act Now",
      icon: Truck,
      color: "yellow",
      link: "/dashboard/pickup?filter=pending",
    },
  ];

  // Wallet Balance
  const walletBalance = {
    available: "₹1,25,680.50",
    pending: "₹12,450.00",
    total: "₹1,38,130.50",
  };

  // const DashboardCarousel: React.FC = () => {
  // const cards: CardType[] = [
  //   { title: "Total Orders", value: "12,345", info: "+12.5% from last month" },
  //   { title: "RTO", value: "1.2%", info: "-0.1% from last month" },
  //   { title: "In Transit", value: "200", info: "+12 from last week" },
  //   { title: "Pending", value: "25", info: "+2 from last week" },
  //   { title: "Bad Orders", value: "25", info: "+13 from last week" },
  // ];

  // Monthly Shipment Volume Data
  const monthlyShipmentData = [
    { month: "Jan", shipments: 4000 },
    { month: "Feb", shipments: 3000 },
    { month: "Mar", shipments: 5000 },
    { month: "Apr", shipments: 4500 },
    { month: "May", shipments: 6000 },
    { month: "Jun", shipments: 5500 },
    { month: "Jul", shipments: 7000 },
    { month: "Aug", shipments: 6500 },
    { month: "Sep", shipments: 7500 },
    { month: "Oct", shipments: 8000 },
    { month: "Nov", shipments: 9000 },
    { month: "Dec", shipments: 8500 },
  ];

  // India coverage data (example only, can be wired to real API later)
  const indiaCoverageData = [
    {
      stateCode: "MH",
      name: "Maharashtra",
      shipments: 2400,
      couriers: ["Delhivery", "BlueDart"],
    },
    {
      stateCode: "DL",
      name: "Delhi",
      shipments: 1900,
      couriers: ["Delhivery", "Ecom Express"],
    },
    {
      stateCode: "KA",
      name: "Karnataka",
      shipments: 1500,
      couriers: ["BlueDart"],
    },
    {
      stateCode: "TS",
      name: "Telangana",
      shipments: 1200,
      couriers: ["Delhivery"],
    },
    {
      stateCode: "TN",
      name: "Tamil Nadu",
      shipments: 900,
      couriers: ["DTDC"],
    },
    {
      stateCode: "GJ",
      name: "Gujarat",
      shipments: 800,
      couriers: ["Delhivery", "Shadowfax"],
    },
    {
      stateCode: "WB",
      name: "West Bengal",
      shipments: 700,
      couriers: ["Ecom Express"],
    },
  ];

  const statesCovered = indiaCoverageData.filter((d) => d.shipments > 0).length;
  const topState =
    indiaCoverageData.length > 0
      ? indiaCoverageData.reduce((max, d) =>
          d.shipments > max.shipments ? d : max
        )
      : null;
  const activeCouriersCount = Array.from(
    new Set(
      indiaCoverageData.flatMap((d: any) => (d.couriers ? d.couriers : []))
    )
  ).length;

  // Scheduled Pickups
  const scheduledPickups = [
    {
      id: "PU-001",
      warehouse: "Main Warehouse",
      address: "123 Industrial Area, Sector 18, Noida - 201301",
      date: "2025-01-18",
      time: "10:00 AM - 2:00 PM",
      courier: "Delhivery",
      status: "Out for Pickup",
      orders: 45,
      weight: "125 kg",
      vendor: "Warehouse A",
    },
    {
      id: "PU-002",
      warehouse: "Secondary Warehouse",
      address: "456 Logistics Park, Whitefield, Bangalore - 560066",
      date: "2025-01-18",
      time: "11:00 AM - 3:00 PM",
      courier: "BlueDart",
      status: "Scheduled",
      orders: 32,
      weight: "89 kg",
      vendor: "Warehouse B",
    },
    {
      id: "PU-003",
      warehouse: "Main Warehouse",
      address: "123 Industrial Area, Sector 18, Noida - 201301",
      date: "2025-01-19",
      time: "10:00 AM - 2:00 PM",
      courier: "Delhivery",
      status: "Scheduled",
      orders: 28,
      weight: "67 kg",
      vendor: "Warehouse A",
    },
    {
      id: "PU-004",
      warehouse: "Vendor Hub",
      address: "789 Export Zone, Andheri East, Mumbai - 400069",
      date: "2025-01-17",
      time: "2:00 PM - 5:00 PM",
      courier: "Ecom Express",
      status: "Picked",
      orders: 67,
      weight: "198 kg",
      vendor: "Vendor C",
    },
    {
      id: "PU-005",
      warehouse: "Secondary Warehouse",
      address: "456 Logistics Park, Whitefield, Bangalore - 560066",
      date: "2025-01-16",
      time: "9:00 AM - 1:00 PM",
      courier: "BlueDart",
      status: "Failed",
      orders: 12,
      weight: "34 kg",
      vendor: "Warehouse B",
    },
  ];

  // Helper function to get time-sensitive message
  const getTimeSensitiveMessage = (date: string, status: string) => {
    const today = new Date().toISOString().split("T")[0];
    const pickupDate = date;
    
    if (status === "Failed") {
      return "Pickup Failed – Reschedule Now";
    }
    if (status === "Picked") {
      return "Pickup Completed";
    }
    if (status === "Out for Pickup") {
      return "Pickup Today – Prepare Shipment";
    }
    if (pickupDate === today) {
      return "Pickup Today – Prepare Shipment";
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    if (pickupDate === tomorrowStr) {
      return "Pickup Tomorrow – Prepare in Advance";
    }
    return "Upcoming Pickup";
  };

  // Helper function to get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Out for Pickup":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Picked":
        return "bg-green-100 text-green-800 border-green-300";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Group pickups by warehouse/vendor
  const groupedPickups = scheduledPickups.reduce((acc, pickup) => {
    const key = pickup.warehouse;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(pickup);
    return acc;
  }, {} as Record<string, typeof scheduledPickups>);

  // Recent Transactions Data
  const recentTransactions = [
    {
      id: "TXN-12345",
      user: "John Doe",
      service: "API Processing",
      status: "Completed",
      amount: "$1,250",
      date: "2025-01-15",
      provider: "Cloud Service A",
    },
    {
      id: "TXN-12346",
      user: "Jane Smith",
      service: "Data Analytics",
      status: "In Progress",
      amount: "$890",
      date: "2025-01-15",
      provider: "Cloud Service B",
    },
    {
      id: "TXN-12347",
      user: "Mike Johnson",
      service: "ML Processing",
      status: "Processing",
      amount: "$2,100",
      date: "2025-01-14",
      provider: "Cloud Service C",
    },
    {
      id: "TXN-12348",
      user: "Sarah Williams",
      service: "Storage Sync",
      status: "Completed",
      amount: "$750",
      date: "2025-01-14",
      provider: "Cloud Service A",
    },
    {
      id: "TXN-12349",
      user: "David Brown",
      service: "Compute Task",
      status: "Pending",
      amount: "$1,500",
      date: "2025-01-13",
      provider: "Cloud Service B",
    },
  ];

  // const DashboardCarousel = () => {
  // const cards = [
  //   { title: "Total Orders", value: "12,345", info: "+12.5% from last month" },
  //   { title: "RTO", value: "1.2%", info: "-0.1% from last month" },
  //   { title: "In Transit", value: "200", info: "+12 from last week" },
  //   { title: "Pending", value: "25", info: "+2 from last week" },
  //   { title: "Bad Orders", value: "25", info: "+13 from last week" },
  // ];

  const whatsNew = [
    {
      id: "NWS-001",
      title: "Bulk Order Upload: CSV support",
      date: "2025-11-28",
      summary:
        "You can now upload orders in bulk using CSV files to speed up onboarding.",
    },
    {
      id: "NWS-002",
      title: "New Courier Integration: QuickShip",
      date: "2025-11-26",
      summary:
        "QuickShip courier integration added for faster pick up scheduling.",
    },
    {
      id: "NWS-003",
      title: "Dashboard Performance Improvements",
      date: "2025-11-20",
      summary:
        "Charts and maps now load faster thanks to lazy-loading optimizations.",
    },
    {
      id: "NWS-004",
      title: "New: Rate Card Export",
      date: "2025-11-18",
      summary: "Export your rate cards to CSV for offline analysis.",
    },
    {
      id: "NWS-005",
      title: "Pincode Serviceability Enhancements",
      date: "2025-11-15",
      summary: "Improved matching for rural pincodes and faster lookups.",
    },
    {
      id: "NWS-006",
      title: "New: Auto-RTO Detection",
      date: "2025-11-12",
      summary:
        "System now suggests likely RTO cases based on historical trends.",
    },
    {
      id: "NWS-007",
      title: "Support Chat: In-App Messaging",
      date: "2025-11-08",
      summary: "Reach support directly from the dashboard for faster help.",
    },
    {
      id: "NWS-008",
      title: "Security Update: 2FA",
      date: "2025-11-05",
      summary:
        "Optional Two-Factor Authentication is now available for accounts.",
    },
    {
      id: "NWS-009",
      title: "Analytics Export Improvements",
      date: "2025-11-02",
      summary:
        "Exports now include breakdowns by courier and destination state.",
    },
    {
      id: "NWS-010",
      title: "UI Tweaks: Compact List Mode",
      date: "2025-10-30",
      summary: "Enable compact list mode for a denser overview of orders.",
    },
  ];

  const orders = [
    {
      id: "ORD-12345",
      orderId: "12345",
      customer: "John Doe",
      phone: "+91 98765 43210",
      destination: "Mumbai, MH - 400001",
      status: "Delivered",
      codAmount: "₹0",
      weight: "0.5 kg",
      courier: "Delhivery",
      channel: "Shopify",
      date: "2025-01-15",
      deliveryDate: "2025-01-17",
      awb: "DEL123456789",
      trackingDetails: [
        { status: "Order Placed", date: "2025-01-15", time: "10:30 AM" },
        { status: "Picked Up", date: "2025-01-15", time: "2:45 PM" },
        { status: "In Transit", date: "2025-01-16", time: "9:15 AM" },
        { status: "Out for Delivery", date: "2025-01-17", time: "8:00 AM" },
        { status: "Delivered", date: "2025-01-17", time: "3:20 PM" },
      ],
      type: "forward",
    },
    {
      id: "ORD-12346",
      orderId: "12346",
      customer: "Jane Smith",
      phone: "+91 98765 43211",
      destination: "Delhi, DL - 110001",
      status: "In Transit",
      codAmount: "₹890",
      weight: "0.8 kg",
      courier: "BlueDart",
      channel: "Amazon",
      date: "2025-01-15",
      deliveryDate: "2025-01-18",
      awb: "BLU987654321",
      trackingDetails: [
        { status: "Order Placed", date: "2025-01-15", time: "11:00 AM" },
        { status: "Picked Up", date: "2025-01-15", time: "4:30 PM" },
        { status: "In Transit", date: "2025-01-16", time: "10:00 AM" },
      ],
      type: "forward",
    },
    {
      id: "ORD-12347",
      orderId: "12347",
      customer: "Mike Johnson",
      phone: "+91 98765 43212",
      destination: "Bangalore, KA - 560001",
      status: "Processing",
      codAmount: "₹0",
      weight: "1.2 kg",
      courier: "Delhivery",
      channel: "WooCommerce",
      date: "2025-01-14",
      deliveryDate: "-",
      awb: "-",
      trackingDetails: [],
      type: "forward",
    },
    {
      id: "RTO-12348",
      orderId: "12348",
      customer: "Sarah Williams",
      phone: "+91 98765 43213",
      destination: "Pune, MH - 411001",
      status: "RTO",
      codAmount: "₹750",
      weight: "0.3 kg",
      courier: "Delhivery",
      channel: "Flipkart",
      date: "2025-01-14",
      deliveryDate: "-",
      awb: "DEL987654321",
      trackingDetails: [
        { status: "Order Placed", date: "2025-01-14", time: "9:00 AM" },
        { status: "Picked Up", date: "2025-01-14", time: "3:00 PM" },
        { status: "RTO Initiated", date: "2025-01-16", time: "11:00 AM" },
      ],
      type: "reverse",
    },
    {
      id: "ORD-12349",
      orderId: "12349",
      customer: "David Brown",
      phone: "+91 98765 43214",
      destination: "Chennai, TN - 600001",
      status: "Pending",
      codAmount: "₹0",
      weight: "0.9 kg",
      courier: "BlueDart",
      channel: "Manual",
      date: "2025-01-13",
      deliveryDate: "-",
      awb: "-",
      trackingDetails: [],
      type: "forward",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string }> = {
      Completed: { className: "bg-green-100 text-green-800 border-green-200" },
      "In Progress": { className: "bg-blue-100 text-blue-800 border-blue-200" },
      Processing: {
        className: "bg-orange-100 text-orange-800 border-orange-200",
      },
      Pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    };
    const config = statusConfig[status] || {
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <Badge variant="outline" className={config.className}>
        {status}
      </Badge>
    );
  };

  // Compact Pickup Row Component
  const PickupRow = ({
    pickup,
    isUrgent,
  }: {
    pickup: (typeof scheduledPickups)[0];
    isUrgent: boolean;
  }) => {
    const timeMessage = getTimeSensitiveMessage(pickup.date, pickup.status);
    const dateStr = new Date(pickup.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  return (
      <div
        className={`group flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
          isUrgent
            ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-300"
            : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
        }`}
        onClick={() => navigate(`/dashboard/pickup?id=${pickup.id}`)}
      >
        {/* Status Badge - Prioritized */}
        <Badge
          className={`${getStatusBadgeStyle(pickup.status)} border font-medium text-xs shrink-0`}
        >
          {pickup.status}
        </Badge>

        {/* Pickup ID */}
        <span className="font-semibold text-sm text-gray-900 shrink-0 w-20">
          {pickup.id}
        </span>

        {/* Grouped Metadata */}
        <div className="flex-1 min-w-0 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-900">{dateStr}</span>
            <span className="text-gray-500">{pickup.time.split(" - ")[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{pickup.address.split(",")[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            <span>{pickup.orders} orders</span>
            <span className="text-gray-500">•</span>
            <span>{pickup.weight}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Truck className="w-3.5 h-3.5 text-gray-400" />
            <span>{pickup.courier}</span>
          </div>
        </div>

        {/* Quick Actions on Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Rescheduling ${pickup.id}...`);
            }}
            title="Reschedule"
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Escalating ${pickup.id}...`);
            }}
            title="Escalate"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`Downloading manifest for ${pickup.id}...`);
            }}
            title="Download Manifest"
          >
            <FileDown className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Arrow Indicator */}
        <ArrowUpRight
          className={`w-4 h-4 shrink-0 ${
            isUrgent ? "text-amber-600" : "text-gray-400"
          } opacity-0 group-hover:opacity-100 transition-opacity`}
        />
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
        isB2B
          ? "bg-slate-100"
          : "bg-gradient-to-br from-gray-50 to-blue-50 bg-slate-100"
      }`}
    >
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            {isB2B ? "B2B Dashboard" : "B2C Dashboard"}
          </h1>
          <p className="text-gray-600 text-lg">
            {isB2B
              ? "Take action on bulk consignments, GST workflows and enterprise tools."
              : "Review and act on your retail shipments and wallet activity."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isB2B && (
          <Button
            onClick={handleSyncOrders}
            className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Orders
          </Button>
          )}
          <Button
            asChild
            className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
          >
            <Link to="/dashboard/orders/new">
              <Plus className="w-4 h-4 mr-2" />
              {isB2B ? "New B2B Consignment" : "New Order"}
            </Link>
          </Button>
        </div>
      </div>

      {/* ============================================
          ZONE 1: ACTION ZONE (Always Visible)
          ============================================ */}
      {actionRequiredItems.some((item) => item.count > 0) && (
        <div className="mb-12">
          <Card className="bg-white border border-amber-200/60 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-lg font-bold text-gray-900">
                  Action Required
                </CardTitle>
              </div>
              </CardHeader>
            <CardContent className="pt-0 pb-4">
              <TooltipProvider>
                <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:justify-start">
                  {actionRequiredItems
                    .filter((item) => item.count > 0)
                    .map((item) => {
                      const Icon = item.icon;
                      const isRed = item.color === "red";
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all cursor-pointer group min-w-0 flex-1 lg:flex-initial ${
                                isRed
                                  ? "border-red-200/60 bg-white hover:border-red-300 hover:bg-red-50/30"
                                  : "border-amber-200/60 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                              }`}
                              onClick={() => {
                                navigate(item.link);
                                toast.info(`Navigating to ${item.title}...`);
                              }}
                            >
                              <div
                                className={`p-1.5 rounded ${
                                  isRed
                                    ? "bg-red-50 text-red-600"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-900 truncate">
                                    {item.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-semibold px-1.5 py-0 ${
                                      isRed
                                        ? "border-red-300 text-red-700 bg-red-50"
                                        : "border-amber-300 text-amber-700 bg-amber-50"
                                    }`}
                                  >
                                    {item.count}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {item.cta}
                                </p>
                              </div>
                              <ArrowUpRight
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isRed ? "text-red-500" : "text-amber-500"
                                } opacity-0 group-hover:opacity-100 transition-opacity`}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="font-medium mb-1">{item.title}</p>
                            <p className="text-sm text-gray-300">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                </div>
              </TooltipProvider>
              </CardContent>
            </Card>
        </div>
      )}

      {/* ============================================
          ZONE 2: OPERATIONS OVERVIEW (Collapsible)
          ============================================ */}
      <div className="mb-12">
        <Collapsible open={operationsExpanded} onOpenChange={setOperationsExpanded}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Operations Overview
                </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-0.5">
                        Pickups, orders, and active shipments
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {operationsExpanded ? "Expanded" : "Collapsed"}
                    </Badge>
                    {operationsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6 space-y-6">
                {/* KPI Cards - Compact and Supportive */}
                {isB2B ? (
        <>
          {/* B2B KPIs */}
          <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:justify-start">
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/orders")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">B2B Consignments</span>
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">320</div>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  +8.2%
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/billing?filter=pending-invoices")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">Pending GST Invoices</span>
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">14</div>
                <p className="text-xs text-amber-600 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Action required
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/billing")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">Credit Utilisation</span>
                  <Wallet className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">68%</div>
                <p className="text-xs text-gray-500">of limit</p>
              </CardContent>
            </Card>
            
          </div>

          {/* B2B analytics: no playful gradients, more structured */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-white border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      Invoice Status Overview
                </CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      Breakdown of GST invoice lifecycle
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-600 hover:text-slate-900"
                    onClick={() => navigate("/dashboard/billing")}
                  >
                    View All
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Generated</span>
                  <span className="font-semibold">128</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Submitted</span>
                  <span className="font-semibold">114</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending filing</span>
                  <span className="font-semibold text-amber-600">14</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                  onClick={() => navigate("/dashboard/billing?filter=pending")}
                >
                  File Pending Invoices
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      Monthly B2B Shipment Volume
                </CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      Consignments processed over the past year
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-600 hover:text-slate-900"
                    onClick={() => navigate("/dashboard/analytics")}
                  >
                    Analyze Trends
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyShipmentData}>
                    <CartesianGrid stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                    <YAxis stroke="#6B7280" fontSize={11} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1E293B",
                        color: "white",
                      }}
                      labelStyle={{ color: "white", fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="shipments"
                      stroke="#0F172A"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#0F172A" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* B2C KPIs */}
          <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:justify-start">
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/orders")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">Total Orders</span>
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">12,345</div>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  +12.5%
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-red-200 hover:border-red-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/orders?filter=rto")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">RTO Cases</span>
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">10</div>
                <p className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -0.1%
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/tracking")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">In Transit</span>
                  <Truck className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">200</div>
                <p className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  +12
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/orders?filter=pending")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">Pending Orders</span>
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">25</div>
                <p className="text-xs text-amber-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -2
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="flex-1 min-w-[140px] bg-white border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow transition-all cursor-pointer group"
              onClick={() => navigate("/dashboard/orders?filter=address-errors")}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">Address Errors</span>
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-0.5">25</div>
                <p className="text-xs text-amber-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -13
                </p>
              </CardContent>
            </Card>
          </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">
                  98.2% Success Rate
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Your delivery success rate is outstanding
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="relative w-48 h-48 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#067adf] to-purple-500 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      98.2%
                    </span>
            </div>
          </div>
                <Button
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
                  onClick={() => navigate("/dashboard/analytics")}
                >
                  Optimize Performance
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

        {/* Line Chart */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#067adf] to-purple-200 border border-white/10 shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
            <CardTitle className="text-xl font-bold text-white">
              Monthly Shipment Volume
            </CardTitle>
            <CardDescription className="mt-1 text-gray-200">
              Number of shipments over the past year
            </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 transition-all"
                    onClick={() => navigate("/dashboard/analytics")}
                  >
                    Analyze Trends
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyShipmentData}>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    borderColor: "#067adf",
                    color: "white",
                  }}
                  itemStyle={{ color: "white" }}
                  labelStyle={{ color: "white", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="shipments"
                  stroke="white"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "white" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
        </>
      )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* ============================================
          PICKUP OPERATIONS (Collapsible)
          ============================================ */}
      <div className="mb-12">
        <Collapsible open={pickupOperationsExpanded} onOpenChange={setPickupOperationsExpanded}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-200">
            <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Pickup Operations
                </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-0.5">
                        {scheduledPickups.length} active pickups across{" "}
                        {Object.keys(groupedPickups).length} locations
                </CardDescription>
              </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                <Link
                  to="/dashboard/pickup"
                  className="text-blue-600 hover:text-blue-700"
                >
                        Manage All
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
                    <Badge variant="outline" className="text-xs">
                      {pickupOperationsExpanded ? "Expanded" : "Collapsed"}
                    </Badge>
                    {pickupOperationsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
            </div>
          </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                      <div className="space-y-4">
                        {Object.entries(groupedPickups).map(([warehouse, pickups]) => {
                          const sortedPickups = sortPickupsByPriority(pickups);
                          const primaryPickup = sortedPickups[0];
                          const additionalPickups = sortedPickups.slice(1);
                          const isExpanded = expandedWarehouses.has(warehouse);
                          const hasMore = additionalPickups.length > 0;

                          return (
                            <div key={warehouse} className="space-y-2">
                              {/* Warehouse Header */}
                              <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                <h3 className="font-semibold text-sm text-gray-900">
                                  {warehouse}
                                </h3>
                                <Badge variant="outline" className="text-xs font-normal">
                                  {pickups.length}
                                </Badge>
                    </div>

                              {/* Primary Pickup - Compact Row */}
                              {primaryPickup && (
                                <PickupRow
                                  pickup={primaryPickup}
                                  isUrgent={
                                    primaryPickup.status === "Out for Pickup" ||
                                    primaryPickup.status === "Failed" ||
                                    (primaryPickup.date ===
                                      new Date().toISOString().split("T")[0] &&
                                      primaryPickup.status === "Scheduled")
                                  }
                                />
                              )}

                              {/* Additional Pickups - Collapsed */}
                              {hasMore && (
                                <>
                                  {isExpanded ? (
                                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                      {additionalPickups.map((pickup) => (
                                        <PickupRow
                                          key={pickup.id}
                                          pickup={pickup}
                                          isUrgent={
                                            pickup.status === "Out for Pickup" ||
                                            pickup.status === "Failed"
                                          }
                                        />
                                      ))}
                                    </div>
                                  ) : null}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    onClick={() => toggleWarehouse(warehouse)}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3 mr-1" />
                                        Show Less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3 mr-1" />
                                        View {additionalPickups.length} More
                                      </>
                                    )}
                                  </Button>
                                </>
                              )}
                  </div>
                          );
                        })}
            </div>
          </CardContent>
            </CollapsibleContent>
        </Card>
        </Collapsible>
      </div>

      {/* ============================================
          RECENT ORDERS (Inside Operations Overview)
          ============================================ */}
      <div className="mb-12">
        <Collapsible open={operationsExpanded} onOpenChange={setOperationsExpanded}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-200">
            <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
              <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Recent Orders
                </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-0.5">
                        Latest {Math.min(recentTransactions.length, 3)} transactions
                </CardDescription>
              </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                <Link
                        to="/dashboard/orders"
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
                    <Badge variant="outline" className="text-xs">
                      {operationsExpanded ? "Expanded" : "Collapsed"}
                    </Badge>
                    {operationsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
            </div>
          </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {recentTransactions.slice(0, 3).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                    <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {transaction.id}
                      </span>
                          {getStatusBadge(transaction.status)}
                    </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {transaction.user} • {transaction.service}
                        </p>
                  </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gray-900">
                          {transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* ============================================
          ZONE 4: DISCOVERY & TOOLS (Collapsible)
          ============================================ */}
      <div className="mb-12">
        <Collapsible open={discoveryExpanded} onOpenChange={setDiscoveryExpanded}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-200">
            <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
              <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Discovery & Tools
                </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-0.5">
                        Quick actions, updates, and coverage insights
                </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {discoveryExpanded ? "Expanded" : "Collapsed"}
                    </Badge>
                    {discoveryExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
              </div>
            </div>
          </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6 space-y-6">
                {/* India Coverage Map - Compact Preview */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-gray-900">
                          India Shipping Coverage
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-xs text-gray-600">
                          {statesCovered} states • {activeCouriersCount} couriers
                        </CardDescription>
                      </div>
              <Button
                variant="outline"
                        size="sm"
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                        onClick={() => navigate("/dashboard/analytics?view=coverage")}
              >
                        Expand Coverage
                        <ArrowUpRight className="w-3 h-3 ml-1.5" />
              </Button>
            </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-6">
                      {/* Compact Map Preview */}
                      <div className="flex-shrink-0 w-64">
                        <div className="h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative">
                          <div className="w-full h-full [&>div]:max-h-40 [&>div>svg]:max-h-40">
                            <IndiaCoverageMap data={indiaCoverageData} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500 justify-center">
                          <span>Lower</span>
                          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-blue-100 to-blue-600" />
                          <span>Higher</span>
                        </div>
                      </div>
                      
                      {/* Key Stats */}
                      <div className="flex-1 grid grid-cols-3 gap-6">
                    <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">
                            States Covered
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statesCovered}
                          </p>
                    </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">
                            Top State
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {topState ? topState.name : "—"}
                          </p>
                          {topState && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {topState.shipments.toLocaleString()} shipments
                            </p>
                          )}
                  </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">
                            Active Couriers
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {activeCouriersCount}
                          </p>
                </div>
                      </div>
            </div>
          </CardContent>
        </Card>

      {/* Quick Actions */}
                <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {activeDashboard === "b2b" ? "B2B Quick Actions" : "Quick Actions"}
          </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 text-sm">
                      {activeDashboard === "b2b"
                        ? "Key tools for managing business shipments."
                        : "Common tasks and shortcuts for retail shipping."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
                    {activeDashboard === "b2b" ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          className="h-28 flex-col bg-white border-gray-200 hover:border-slate-600 hover:bg-slate-50 transition-all group"
                          asChild
                        >
                          <Link to="/dashboard/orders/new">
                            <Plus className="w-7 h-7 mb-2 text-slate-800 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-gray-900">
                              Create B2B Consignment
                            </span>
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-28 flex-col bg-white border-gray-200 hover:border-slate-600 hover:bg-slate-50 transition-all group"
                          asChild
                        >
                          <Link to="/dashboard/billing">
                            <FileText className="w-7 h-7 mb-2 text-slate-800 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-gray-900">
                              GST & Invoices
                            </span>
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-28 flex-col bg-white border-gray-200 hover:border-slate-600 hover:bg-slate-50 transition-all group"
                          asChild
                        >
                          <Link to="/dashboard/services">
                            <Truck className="w-7 h-7 mb-2 text-slate-800 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-gray-900">
                              Bulk Shipment Tools
                            </span>
                          </Link>
                        </Button>
                      </div>
                    ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-28 flex-col bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              asChild
            >
              <Link to="/dashboard/orders/new">
                <Plus className="w-7 h-7 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-gray-900">
                  Create Order
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-28 flex-col bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              asChild
            >
              <Link to="/dashboard/tracking">
                <Truck className="w-7 h-7 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-gray-900">
                  Track Shipment
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-28 flex-col bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              asChild
            >
              <Link to="/dashboard/settings">
                <Settings className="w-7 h-7 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-gray-900">Settings</span>
              </Link>
            </Button>
          </div>
                    )}
        </CardContent>
      </Card>

                {/* What's New - Secondary */}
                <Card className="bg-gray-50/50 border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <CardTitle className="text-sm font-medium text-gray-700">
                          Recent Updates
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal text-gray-500">
                        {whatsNew.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-3">
                    <div className="space-y-2">
                      {whatsNew.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="p-2 border border-gray-100 rounded-md hover:bg-white hover:border-gray-200 transition-colors cursor-pointer group"
                          onClick={() => toast.info(`Learn more about: ${item.title}`)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.date}</p>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-7"
                      onClick={() => toast.info("Viewing all updates...")}
                    >
                      View All {whatsNew.length} Updates
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* <h1>India Shipment Status Dashboard</h1>
      <p>Hover over a state to see the delivery metrics.</p>
       Pass the state name from your image to highlight it 
      <IndiaShipmentMap highlightedState="Andhra Pradesh" /> */}
    </div>
  );
};

export default Dashboard;
