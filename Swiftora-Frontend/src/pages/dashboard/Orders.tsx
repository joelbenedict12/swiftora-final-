import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  Plus,
  MoreHorizontal,
  Send,
  XCircle,
  Building,
  Zap,
  ShoppingCart,
  Loader2,
  Calendar,
  AlertTriangle,
  FileDown,
  Pencil,
  Wallet,
  Copy,
  Upload,
  RotateCcw,
} from "lucide-react";
import { ordersApi, warehousesApi, ticketsApi, trackingApi, ndrApi, reverseApi } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

// Xpressbees service option type
type XpressbeesService = {
  courier: string;
  service_id: string;
  service_name: string;
  freight: number;
  cod: number;
  total: number;
  chargeable_weight?: number;
};

// Delhivery service option type
type DelhiveryService = {
  courier: 'DELHIVERY';
  service_id: string;
  service_name: string;
  freight: number;
  cod: number;
  total: number;
  estimated_days?: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  awbNumber?: string | null;
  courierName?: string | null;
  channel?: string | null;
  status: string;
  createdAt: string;
  paymentMode?: string;
  codAmount?: number | null;
  deliveryType?: string | null;
  warehouse?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  } | null;
  warehouseId?: string;
};

// Courier display config (colors and short labels)
const COURIER_CONFIG: Record<string, { label: string; color: string }> = {
  DELHIVERY: { label: 'Delhivery', color: 'bg-blue-100 text-blue-700' },
  XPRESSBEES: { label: 'Xpressbees', color: 'bg-green-100 text-green-700' },
  EKART: { label: 'Ekart', color: 'bg-purple-100 text-purple-700' },
  BLITZ: { label: 'Blitz', color: 'bg-orange-100 text-orange-700' },
  INNOFULFILL: { label: 'InnoFulfill', color: 'bg-teal-100 text-teal-700' },
};

// Sales channel display config
const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  SHOPIFY: { label: 'Shopify', color: 'bg-emerald-100 text-emerald-700' },
  WOOCOMMERCE: { label: 'WooCommerce', color: 'bg-violet-100 text-violet-700' },
  AMAZON: { label: 'Amazon', color: 'bg-amber-100 text-amber-700' },
  MANUAL: { label: 'Manual', color: 'bg-gray-100 text-gray-700' },
};

type Warehouse = {
  id: string;
  name: string;
  city: string;
  phone: string;
};

const statusBadgeVariant = (status: string) => {
  const normalized = status?.toUpperCase();
  if (["DELIVERED"].includes(normalized)) return "secondary" as const;
  if (["IN_TRANSIT", "READY_TO_SHIP", "OUT_FOR_DELIVERY", "OUT_FOR_PICKUP", "PICKED_UP"].includes(normalized))
    return "outline" as const;
  if (["PENDING", "PROCESSING", "MANIFESTED"].includes(normalized))
    return "default" as const;
  if (["RTO", "RTO_DELIVERED", "FAILED", "CANCELLED", "NDR_PENDING"].includes(normalized))
    return "destructive" as const;
  return "outline" as const;
};

const formatStatus = (status: string) => {
  return status
    ? status
      .toLowerCase()
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")
    : "-";
};

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);

  // Assign pickup location state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState<Order | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Raise ticket state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<Order | null>(null);
  const [ticketData, setTicketData] = useState({
    type: "DELIVERY_ISSUE",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Xpressbees pricing modal state
  const [showXpressbeesModal, setShowXpressbeesModal] = useState(false);
  const [selectedOrderForXpressbees, setSelectedOrderForXpressbees] = useState<Order | null>(null);
  const [xpressbeesServices, setXpressbeesServices] = useState<XpressbeesService[]>([]);
  const [loadingXpressbeesPricing, setLoadingXpressbeesPricing] = useState(false);
  const [selectingService, setSelectingService] = useState<string | null>(null);

  // Delhivery pricing modal state
  const [showDelhiveryModal, setShowDelhiveryModal] = useState(false);
  const [selectedOrderForDelhivery, setSelectedOrderForDelhivery] = useState<Order | null>(null);
  const [delhiveryServices, setDelhiveryServices] = useState<DelhiveryService[]>([]);
  const [loadingDelhiveryPricing, setLoadingDelhiveryPricing] = useState(false);
  const [selectingDelhiveryService, setSelectingDelhiveryService] = useState<string | null>(null);

  // Ekart date picker modal state
  const [showEkartDateModal, setShowEkartDateModal] = useState(false);
  const [selectedOrderForEkart, setSelectedOrderForEkart] = useState<Order | null>(null);
  const [ekartPickupDate, setEkartPickupDate] = useState('');
  const [isShippingEkart, setIsShippingEkart] = useState(false);

  // Post-ship "Add to Pickup" dialog state (Delhivery-style)
  const [showAddToPickup, setShowAddToPickup] = useState(false);
  const [pickupOrderData, setPickupOrderData] = useState<{
    orderId: string;
    warehouseId: string;
    warehouseName: string;
    courierName: string;
    awbNumber: string;
  } | null>(null);
  const [selectedPickupDate, setSelectedPickupDate] = useState("");
  const [selectedPickupSlot, setSelectedPickupSlot] = useState("Evening");
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false);

  // Cancel order state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [generatingLabelId, setGeneratingLabelId] = useState<string | null>(null);

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkCsvData, setBulkCsvData] = useState<Record<string, string>[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);

  // Reverse pickup state
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [selectedOrderForReverse, setSelectedOrderForReverse] = useState<Order | null>(null);
  const [reverseForm, setReverseForm] = useState({ reason: '', pickupDate: '', phone: '', address: '' });
  const [isCreatingReverse, setIsCreatingReverse] = useState(false);
  const [qcEnabled, setQcEnabled] = useState(false);
  const [qcChargeValue, setQcChargeValue] = useState(15);

  // Per-row order details (accordion)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetailsFull, setOrderDetailsFull] = useState<Order | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Edit order modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderBeingEdited, setOrderBeingEdited] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    orderNumber: "",
    customerName: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPincode: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Innofulfill Surface/Air selection modal
  const [showInnofulfillModal, setShowInnofulfillModal] = useState(false);
  const [selectedOrderForInnofulfill, setSelectedOrderForInnofulfill] = useState<Order | null>(null);
  const [isShippingInnofulfill, setIsShippingInnofulfill] = useState(false);

  // Courier comparison modal state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareOrderId, setCompareOrderId] = useState<string | null>(null);
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [compareOrderInfo, setCompareOrderInfo] = useState<any>(null);
  const [compareWallet, setCompareWallet] = useState<any>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [shippingFromCompare, setShippingFromCompare] = useState<string | null>(null);

  // Wallet confirmation dialog state
  const [showWalletConfirm, setShowWalletConfirm] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{
    customerType?: string;
    balance?: number; creditLimit?: number; available?: number;
    totalOutstanding?: number; availableCredit?: number; hasUnpaidInvoice?: boolean;
    isPaused: boolean; canShip: boolean; sufficientBalance?: boolean;
  } | null>(null);
  const [shippingEstimate, setShippingEstimate] = useState<{
    vendorCharge: number; estimateAvailable: boolean; courier: string; note?: string;
  } | null>(null);
  const [loadingWalletCheck, setLoadingWalletCheck] = useState(false);
  const [pendingShipAction, setPendingShipAction] = useState<(() => void) | null>(null);
  const [pendingShipCourier, setPendingShipCourier] = useState<string>('');

  // Generate next 3 available weekdays from today
  const getAvailablePickupDates = () => {
    const dates: Date[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1); // Start from tomorrow
    while (dates.length < 3) {
      const day = d.getDay();
      if (day !== 0) { // Skip Sundays
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  const PICKUP_SLOTS: Record<string, string> = {
    "Morning": "10:00:00 - 13:00:00",
    "Afternoon": "13:00:00 - 16:00:00",
    "Evening": "14:00:00 - 18:00:00",
  };

  // Toggle accordion row with order details (reuses existing GET /orders/:id logic)
  const toggleOrderDetails = async (order: Order) => {
    // Collapse if already expanded
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      setOrderDetailsFull(null);
      return;
    }

    setExpandedOrderId(order.id);
    setLoadingOrderDetails(true);
    setOrderDetailsFull(null);

    try {
      const res = await ordersApi.get(order.id);
      const full = res.data as Order;
      setOrderDetailsFull(full);
    } catch {
      // If fetch fails, we still show basic list data
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Show pickup dialog after successful ship
  const showPickupDialog = (orderId: string, warehouseId: string, warehouseName: string, courierName: string, awbNumber: string) => {
    const dates = getAvailablePickupDates();
    setSelectedPickupDate(dates[0].toISOString().split('T')[0]);
    setSelectedPickupSlot("Evening");
    setPickupOrderData({ orderId, warehouseId, warehouseName, courierName, awbNumber });
    setShowAddToPickup(true);
  };

  // Call Delhivery Pickup Request API
  const handleAddToPickup = async () => {
    if (!pickupOrderData || !selectedPickupDate) return;
    try {
      setIsSchedulingPickup(true);
      const slotTime = PICKUP_SLOTS[selectedPickupSlot]?.split(" - ")[0] || "14:00:00";
      const response = await ordersApi.createDelhiveryPickup({
        warehouseId: pickupOrderData.warehouseId,
        pickupDate: selectedPickupDate,
        pickupTime: slotTime,
        expectedPackageCount: 1,
      });

      if (response.data.success) {
        toast.success(`Pickup scheduled for ${selectedPickupDate} (${selectedPickupSlot})`);
      } else {
        toast.error(response.data.error || "Failed to schedule pickup");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to schedule pickup";
      toast.error(message);
    } finally {
      setIsSchedulingPickup(false);
      setShowAddToPickup(false);
      setPickupOrderData(null);
    }
  };

  // Wallet pre-check: fetches balance + shipping cost estimate, shows confirmation
  const confirmAndShip = async (orderId: string, courierName: string, courierLabel: string, action: () => void) => {
    try {
      setLoadingWalletCheck(true);
      setPendingShipCourier(courierLabel);
      setShippingEstimate(null);
      setWalletInfo(null);
      setShowWalletConfirm(true);

      const res = await ordersApi.shippingEstimate(orderId, courierName);
      const { estimate, wallet } = res.data;
      setShippingEstimate(estimate);
      setWalletInfo(wallet);
      setPendingShipAction(() => action);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to check wallet balance');
      setShowWalletConfirm(false);
    } finally {
      setLoadingWalletCheck(false);
    }
  };

  const handleConfirmShip = () => {
    setShowWalletConfirm(false);
    if (pendingShipAction) {
      pendingShipAction();
      setPendingShipAction(null);
    }
  };

  // Open Innofulfill Surface/Air modal
  const openInnofulfillModal = (order: Order) => {
    setSelectedOrderForInnofulfill(order);
    setShowInnofulfillModal(true);
  };

  // Open courier comparison modal
  const openCompareModal = async (order: Order) => {
    setCompareOrderId(order.id);
    setShowCompareModal(true);
    setCompareResults([]);
    setCompareOrderInfo(null);
    setCompareWallet(null);
    setLoadingCompare(true);
    try {
      const res = await ordersApi.compareRates(order.id);
      if (res.data.success) {
        setCompareResults(res.data.couriers);
        setCompareOrderInfo(res.data.orderInfo);
        setCompareWallet(res.data.wallet);
      } else {
        toast.error(res.data.error || 'Could not compare rates');
        setShowCompareModal(false);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to compare courier rates');
      setShowCompareModal(false);
    } finally {
      setLoadingCompare(false);
    }
  };

  // Ship from comparison modal
  const shipFromCompare = async (courierName: string) => {
    if (!compareOrderId) return;
    try {
      setShippingFromCompare(courierName);
      const response = await ordersApi.ship(
        compareOrderId,
        courierName as 'DELHIVERY' | 'BLITZ' | 'EKART' | 'XPRESSBEES' | 'INNOFULFILL',
      );
      if (response.data.success) {
        toast.success(`Shipped via ${courierName}! AWB: ${response.data.awbNumber}`);
        setShowCompareModal(false);
        loadOrders();
      } else {
        toast.error(response.data.error || 'Failed to ship order');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to ship order');
    } finally {
      setShippingFromCompare(null);
    }
  };

  const handleShipInnofulfill = async (mode: 'SURFACE' | 'AIR') => {
    if (!selectedOrderForInnofulfill) return;
    try {
      setIsShippingInnofulfill(true);
      setShippingOrderId(selectedOrderForInnofulfill.id);
      const response = await ordersApi.shipToInnofulfill(selectedOrderForInnofulfill.id, { deliveryPromise: mode });
      if (response.data.success) {
        toast.success(`Shipped via Innofulfill (${mode})! AWB: ${response.data.awbNumber}`);
        setShowInnofulfillModal(false);
        const order = selectedOrderForInnofulfill;
        setSelectedOrderForInnofulfill(null);
        loadOrders();
        if (order.warehouse) {
          showPickupDialog(
            order.id,
            order.warehouse.id || order.warehouseId || '',
            order.warehouse.name || 'Warehouse',
            'INNOFULFILL',
            response.data.awbNumber
          );
        }
      } else {
        toast.error(response.data.error || 'Failed to ship order');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to ship order');
    } finally {
      setIsShippingInnofulfill(false);
      setShippingOrderId(null);
    }
  };

  // Open Ekart date picker modal
  const openEkartDateModal = (order: Order) => {
    setSelectedOrderForEkart(order);
    const dates = getAvailablePickupDates();
    setEkartPickupDate(dates[0].toISOString().split('T')[0]);
    setShowEkartDateModal(true);
  };

  // Ship to Ekart with selected pickup date
  const handleShipEkart = async () => {
    if (!selectedOrderForEkart || !ekartPickupDate) return;
    try {
      setIsShippingEkart(true);
      const response = await ordersApi.shipToEkart(selectedOrderForEkart.id, ekartPickupDate);
      if (response.data.success) {
        toast.success(`Shipped via Ekart! AWB: ${response.data.awbNumber}`);
        setShowEkartDateModal(false);
        setSelectedOrderForEkart(null);
        loadOrders();
      } else {
        toast.error(response.data.error || 'Failed to ship order');
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to ship order';
      toast.error(message);
    } finally {
      setIsShippingEkart(false);
    }
  };

  // Ship handler that shows pickup dialog on success
  const shipAndShowPickup = async (orderId: string, courierName: string) => {
    try {
      setShippingOrderId(orderId);
      const order = orders.find(o => o.id === orderId);
      const estimatedCharge = shippingEstimate?.vendorCharge;
      const extraParams = estimatedCharge ? { estimatedVendorCharge: estimatedCharge } : {};

      const response = await ordersApi.ship(
        orderId,
        courierName as 'DELHIVERY' | 'BLITZ' | 'EKART' | 'XPRESSBEES' | 'INNOFULFILL',
        extraParams,
      );
      if (response.data.success) {
        toast.success(`Shipped via ${courierName}! AWB: ${response.data.awbNumber}`);
        loadOrders();

        // Show "Add to Pickup" dialog
        if (order?.warehouse) {
          showPickupDialog(
            orderId,
            order.warehouse.id || order.warehouseId,
            order.warehouse.name || 'Warehouse',
            courierName,
            response.data.awbNumber
          );
        }
      } else {
        toast.error(response.data.error || "Failed to ship order");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to ship order";
      toast.error(message);
    } finally {
      setShippingOrderId(null);
    }
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);

      const response = await ordersApi.list({
        status: statusFilter !== 'all' ? statusFilter : '',
        page: 1,
        limit: 100,
      });
      setOrders(response.data.orders || []);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to load orders";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /** Fetch tracking from couriers for all orders with AWB so status (e.g. Out for Pickup) updates in DB and shows here. */
  const syncStatusFromCouriers = async () => {
    try {
      setIsSyncingStatus(true);
      const res = await ordersApi.syncStatus();
      const data = res.data;
      await loadOrders();
      if (data.synced > 0) {
        toast.success(`Updated ${data.synced} of ${data.total} order(s).`);
      } else if (data.total === 0) {
        toast.info("No active shipped orders to sync.");
      } else {
        toast.info(`All ${data.total} order(s) already up to date.`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || "Sync failed");
    } finally {
      setIsSyncingStatus(false);
    }
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      setBulkCsvData(rows);
      setBulkResults(null);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkCsvData.length === 0) return;
    setBulkUploading(true);
    try {
      const res = await ordersApi.bulkImport(bulkCsvData);
      setBulkResults(res.data);
      if (res.data.imported > 0) {
        toast.success(`${res.data.imported} order(s) imported successfully`);
        loadOrders();
      }
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} order(s) failed`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Bulk import failed");
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const header = "customerName,customerPhone,shippingAddress,shippingCity,shippingState,shippingPincode,productName,weight,productValue,paymentMode,codAmount,quantity";
    const sample = "John Doe,9876543210,123 Main St,Mumbai,Maharashtra,400001,T-Shirt,0.5,500,PREPAID,,1";
    const blob = new Blob([header + "\n" + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.list();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    }
  };

  const openEditModal = (order: Order) => {
    if (order.awbNumber) {
      toast.error("You can only edit orders before they are shipped.");
      return;
    }

    setOrderBeingEdited(order);
    setEditForm({
      orderNumber: order.orderNumber || "",
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      shippingAddress: order.shippingAddress || "",
      shippingCity: order.shippingCity || "",
      shippingState: order.shippingState || "",
      shippingPincode: order.shippingPincode || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!orderBeingEdited) return;

    try {
      setIsSavingEdit(true);
      const response = await ordersApi.update(orderBeingEdited.id, {
        orderNumber: editForm.orderNumber,
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        shippingAddress: editForm.shippingAddress,
        shippingCity: editForm.shippingCity,
        shippingState: editForm.shippingState,
        shippingPincode: editForm.shippingPincode,
      });

      if (response.data?.success) {
        toast.success("Order updated successfully");
      } else {
        toast.success("Order updated");
      }

      setShowEditModal(false);
      setOrderBeingEdited(null);
      loadOrders();
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to update order";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openPickupModal = (order: Order) => {
    setSelectedOrderForPickup(order);
    setShowPickupModal(true);
    if (warehouses.length === 0) {
      loadWarehouses();
    }
  };

  const handleAssignPickup = async (warehouseId: string) => {
    if (!selectedOrderForPickup) return;

    try {
      setIsAssigning(true);
      const response = await ordersApi.assignPickupLocation(selectedOrderForPickup.id, warehouseId);

      if (response.data.success) {
        toast.success(
          `Pickup location assigned for ${selectedOrderForPickup.orderNumber}. You can now ship this order.`
        );
        setShowPickupModal(false);
        setSelectedOrderForPickup(null);
        await loadOrders();
      } else {
        toast.error(response.data.error || "Failed to assign pickup location");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to assign";
      toast.error(message);
    } finally {
      setIsAssigning(false);
    }
  };


  // Open Xpressbees pricing modal
  const openXpressbeesModal = async (order: Order) => {
    setSelectedOrderForXpressbees(order);
    setShowXpressbeesModal(true);
    setXpressbeesServices([]);
    setLoadingXpressbeesPricing(true);

    try {
      const response = await ordersApi.getXpressbeesPricing(order.id);
      if (response.data.success) {
        setXpressbeesServices(response.data.services || []);
      } else {
        toast.error(response.data.error || "Could not load Xpressbees pricing");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to load pricing";
      toast.error(message);
    } finally {
      setLoadingXpressbeesPricing(false);
    }
  };

  // Select Xpressbees service and ship
  const handleSelectXpressbeesService = async (service: XpressbeesService) => {
    if (!selectedOrderForXpressbees) return;

    try {
      setSelectingService(service.service_id);

      // First, save the selected service
      await ordersApi.selectXpressbeesService(selectedOrderForXpressbees.id, service);

      // Then ship the order
      const deliveryType = service.service_name.toLowerCase().includes('air') ? 'Air' : 'Surface';
      const response = await ordersApi.shipToXpressbees(selectedOrderForXpressbees.id, {
        serviceId: service.service_id,
        deliveryType,
      });

      if (response.data.success) {
        toast.success(`Shipped via Xpressbees! AWB: ${response.data.awbNumber}`);
        setShowXpressbeesModal(false);
        setSelectedOrderForXpressbees(null);
        loadOrders();
      } else {
        toast.error(response.data.error || "Failed to ship order");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to select service";
      toast.error(message);
    } finally {
      setSelectingService(null);
    }
  };

  // Open Delhivery pricing modal
  const openDelhiveryModal = async (order: Order) => {
    setSelectedOrderForDelhivery(order);
    setShowDelhiveryModal(true);
    setDelhiveryServices([]);
    setLoadingDelhiveryPricing(true);

    try {
      const response = await ordersApi.getDelhiveryPricing(order.id);
      if (response.data.success) {
        setDelhiveryServices(response.data.services || []);
      } else {
        toast.error(response.data.error || "Could not load Delhivery pricing");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to load pricing";
      toast.error(message);
    } finally {
      setLoadingDelhiveryPricing(false);
    }
  };

  // Select Delhivery service and ship
  const handleSelectDelhiveryService = async (service: DelhiveryService) => {
    if (!selectedOrderForDelhivery) return;

    try {
      setSelectingDelhiveryService(service.service_id);

      // First, save the selected service
      await ordersApi.selectDelhiveryService(selectedOrderForDelhivery.id, service);

      // Then ship the order
      const response = await ordersApi.shipToDelhivery(selectedOrderForDelhivery.id, {
        // Map surface/express service id to Delhivery shipping_mode
        shippingMode: service.service_id === 'express' ? 'Express' : 'Surface',
      });

      if (response.data.success) {
        toast.success(`Shipped via Delhivery! AWB: ${response.data.awbNumber}`);
        setShowDelhiveryModal(false);
        setSelectedOrderForDelhivery(null);
        loadOrders();
      } else {
        toast.error(response.data.error || "Failed to ship order");
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Failed to select service";
      toast.error(message);
    } finally {
      setSelectingDelhiveryService(null);
    }
  };

  // Raise Ticket handlers
  const openTicketModal = (order: Order) => {
    setSelectedOrderForTicket(order);
    setTicketData({
      type: "DELIVERY_ISSUE",
      subject: `Issue with Order ${order.orderNumber}`,
      description: "",
      priority: "MEDIUM",
    });
    setShowTicketModal(true);
  };

  const handleCreateTicket = async () => {
    if (!selectedOrderForTicket) return;

    if (!ticketData.subject.trim() || !ticketData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreatingTicket(true);
      const response = await ticketsApi.create({
        type: ticketData.type as any,
        subject: ticketData.subject,
        description: ticketData.description,
        orderId: selectedOrderForTicket.id,
        priority: ticketData.priority as any,
      });

      if (response.data.success) {
        toast.success("Support ticket created successfully! Our team will review it shortly.");
        setShowTicketModal(false);
        setSelectedOrderForTicket(null);
        setTicketData({ type: "DELIVERY_ISSUE", subject: "", description: "", priority: "MEDIUM" });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create ticket");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Cancel order handler
  const openCancelDialog = (order: Order) => {
    setSelectedOrderForCancel(order);
    setShowCancelDialog(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderForCancel) return;
    try {
      setIsCancelling(true);
      const response = await ordersApi.cancel(selectedOrderForCancel.id);
      if (response.data?.success) {
        toast.success(response.data.message || 'Order cancelled successfully');
        setShowCancelDialog(false);
        setSelectedOrderForCancel(null);
        loadOrders(); // refresh the list
      } else {
        toast.error(response.data?.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleGenerateShippingLabel = async (order: Order) => {
    if (!order.awbNumber) {
      toast.error("Order has no AWB yet");
      return;
    }
    try {
      setGeneratingLabelId(order.id);
      const response = await ordersApi.getShippingLabelPdf(order.id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `label-${order.awbNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Shipping label downloaded");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to generate label");
    } finally {
      setGeneratingLabelId(null);
    }
  };

  useEffect(() => {
    loadOrders();
    loadWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) =>
      [o.orderNumber, o.customerName, o.awbNumber, o.customerPhone]
        .filter(Boolean)
        .some((field) => field!.toString().toLowerCase().includes(q))
    );
  }, [orders, search]);

  const stats = {
    total: orders.length,
    inTransit: orders.filter((o) => o.status?.toUpperCase() === "IN_TRANSIT").length,
    delivered: orders.filter((o) => o.status?.toUpperCase() === "DELIVERED").length,
    pendingCod: orders.filter((o) => (o.codAmount || 0) > 0).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage your orders and create shipments with Delhivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={loadOrders} disabled={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowBulkUpload(true)}>
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button className="gap-2" onClick={() => navigate("/dashboard/orders/new")}>
            <Plus className="w-4 h-4" />
            Create Order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">Moving right now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Completed shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COD Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCod}</div>
            <p className="text-xs text-muted-foreground">Awaiting remittance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Fetched from backend in real-time</CardDescription>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search order, customer, AWB"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                  <SelectItem value="out_for_pickup">Out for Pickup</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rto">RTO</SelectItem>
                  <SelectItem value="ndr_pending">NDR Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={syncStatusFromCouriers}
                disabled={isLoading || isSyncingStatus}
                className="gap-2"
                title="Fetch latest status from couriers (e.g. Out for Pickup) and refresh list"
              >
                {isSyncingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                {isSyncingStatus ? "Syncing…" : "Sync status"}
              </Button>
              <Button variant="outline" onClick={loadOrders} disabled={isLoading} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AWB</TableHead>
                <TableHead>COD</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found. Create your first order.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filtered.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const details = orderDetailsFull && orderDetailsFull.id === order.id ? orderDetailsFull : order;

                  return [
                    <TableRow
                      key={order.id}
                      className="hover:bg-muted/50 cursor-pointer align-top"
                      onClick={() => toggleOrderDetails(order)}
                    >
                      <TableCell className="font-medium">{order.orderNumber || order.id}</TableCell>
                      <TableCell>
                        <div>{order.customerName || "-"}</div>
                        <div className="text-sm text-muted-foreground">{order.customerPhone || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span>
                            {[order.shippingCity, order.shippingState, order.shippingPincode]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.courierName ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${COURIER_CONFIG[order.courierName]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {COURIER_CONFIG[order.courierName]?.label || order.courierName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(order.status)} className="capitalize">
                          {formatStatus(order.status)}
                        </Badge>
                        {(order as any).shipmentType === 'REVERSE' && (
                          <Badge variant="outline" className="ml-1 text-purple-600 border-purple-300 bg-purple-50">
                            Reverse
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{order.awbNumber || "-"}</TableCell>
                      <TableCell>
                        {order.paymentMode === "COD"
                          ? `₹${Number(order.codAmount || 0).toFixed(0)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!order.awbNumber && !order.warehouseId && (
                              <DropdownMenuItem
                                onClick={() => openPickupModal(order)}
                                className="gap-2"
                              >
                                <Building className="h-4 w-4" />
                                Assign Pickup Location
                              </DropdownMenuItem>
                            )}
                            {!order.awbNumber && order.warehouseId && (
                              <DropdownMenuItem
                                onClick={() => openPickupModal(order)}
                                className="gap-2"
                              >
                                <Building className="h-4 w-4" />
                                Change Pickup Location
                              </DropdownMenuItem>
                            )}
                            {!order.awbNumber && order.warehouseId && (
                              <DropdownMenuItem
                                onClick={() => openCompareModal(order)}
                                className="gap-2 text-emerald-600 font-medium"
                              >
                                <Truck className="h-4 w-4" />
                                Compare & Ship
                              </DropdownMenuItem>
                            )}
                            {!order.awbNumber && (
                              <DropdownMenuItem
                                onClick={() => confirmAndShip(order.id, 'DELHIVERY', 'Delhivery', () => shipAndShowPickup(order.id, 'DELHIVERY'))}
                                disabled={shippingOrderId === order.id}
                                className="gap-2 text-blue-600"
                              >
                                <Send className="h-4 w-4" />
                                {shippingOrderId === order.id ? "Shipping..." : "Ship to Delhivery"}
                              </DropdownMenuItem>
                            )}
                            {!order.awbNumber && (
                              <DropdownMenuItem
                                onClick={() => confirmAndShip(order.id, 'BLITZ', 'Blitz', () => shipAndShowPickup(order.id, 'BLITZ'))}
                                disabled={shippingOrderId === order.id}
                                className="gap-2 text-orange-600"
                              >
                                <Zap className="h-4 w-4" />
                                {shippingOrderId === order.id ? "Shipping..." : "Ship to Blitz"}
                              </DropdownMenuItem>
                            )}
                            {!order.awbNumber && (
                              <DropdownMenuItem
                                onClick={() => confirmAndShip(order.id, 'EKART', 'Ekart', () => openEkartDateModal(order))}
                                className="gap-2 text-purple-600"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Ship to Ekart
                              </DropdownMenuItem>
                            )}
                            {/* Xpressbees option */}
                            {!order.awbNumber && order.warehouse && (
                              <DropdownMenuItem
                                onClick={() => confirmAndShip(order.id, 'XPRESSBEES', 'Xpressbees', () => openXpressbeesModal(order))}
                                className="gap-2 text-green-600"
                              >
                                <Truck className="h-4 w-4" />
                                Ship via Xpressbees
                              </DropdownMenuItem>
                            )}
                            {/* Delhivery with options */}
                            {!order.awbNumber && order.warehouse && (
                              <DropdownMenuItem
                                onClick={() => confirmAndShip(order.id, 'DELHIVERY', 'Delhivery (Surface/Express)', () => openDelhiveryModal(order))}
                                className="gap-2 text-indigo-600"
                              >
                                <Package className="h-4 w-4" />
                                Delhivery (Surface/Express)
                              </DropdownMenuItem>
                            )}
                            {/* Innofulfill option (Surface/Air choice) */}
                            {!order.awbNumber && order.warehouse && (
                              <DropdownMenuItem
                                onClick={() => confirmAndShip(order.id, 'INNOFULFILL', 'Innofulfill', () => openInnofulfillModal(order))}
                                disabled={shippingOrderId === order.id}
                                className="gap-2 text-teal-600"
                              >
                                <Truck className="h-4 w-4" />
                                {shippingOrderId === order.id ? "Shipping..." : "Ship via Innofulfill (Surface/Air)"}
                              </DropdownMenuItem>
                            )}
                            {!order.awbNumber && (
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => openEditModal(order)}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit Order
                              </DropdownMenuItem>
                            )}
                            {order.awbNumber && (
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => navigate(`/dashboard/tracking?awb=${encodeURIComponent(order.awbNumber!)}`)}
                              >
                                <Truck className="h-4 w-4" />
                                Track Shipment
                              </DropdownMenuItem>
                            )}
                            {order.awbNumber && (
                              <DropdownMenuItem
                                onClick={() => handleGenerateShippingLabel(order)}
                                disabled={generatingLabelId === order.id}
                                className="gap-2"
                              >
                                {generatingLabelId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileDown className="h-4 w-4" />
                                )}
                                Generate Shipping Label
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                              <DropdownMenuItem
                                onClick={() => openCancelDialog(order)}
                                className="gap-2 text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                            {['DELIVERED', 'NDR_PENDING', 'RTO'].includes(order.status) && (order as any).shipmentType !== 'REVERSE' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrderForReverse(order);
                                  setReverseForm({ reason: '', pickupDate: '', phone: '', address: '' });
                                  setQcEnabled(false);
                                  setShowReverseModal(true);
                                  // Fetch QC charge setting
                                  reverseApi.settings().then(r => setQcChargeValue(r.data.qcCharge || 15)).catch(() => { });
                                }}
                                className="gap-2 text-purple-600"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Initiate Reverse Pickup
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                navigate("/dashboard/create-order", {
                                  state: {
                                    cloneFrom: {
                                      customerName: order.customerName,
                                      customerPhone: order.customerPhone,
                                      shippingAddress: order.shippingAddress,
                                      shippingCity: order.shippingCity,
                                      shippingState: order.shippingState,
                                      shippingPincode: order.shippingPincode,
                                      paymentMode: order.paymentMode,
                                      codAmount: order.codAmount,
                                      warehouseId: order.warehouseId,
                                    },
                                  },
                                });
                              }}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Clone Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openTicketModal(order)}
                              className="gap-2 text-amber-600"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Raise Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>,
                    isExpanded && (
                      <TableRow key={`${order.id}-details`} className="bg-muted/40">
                        <TableCell colSpan={9}>
                          {loadingOrderDetails ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Loading details...</span>
                            </div>
                          ) : (
                            <div className="space-y-4 py-2">
                              <div className="grid gap-3 rounded-lg border p-4 bg-muted/40">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs uppercase text-muted-foreground">Order</p>
                                    <p className="font-semibold text-sm">
                                      {details.orderNumber}
                                    </p>
                                  </div>
                                  <div className="text-right text-xs text-muted-foreground">
                                    <p>Created</p>
                                    <p className="font-medium">
                                      {details.createdAt
                                        ? new Date(details.createdAt!).toLocaleString()
                                        : "-"}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs uppercase text-muted-foreground mb-1">Customer</p>
                                    <p className="font-medium">{details.customerName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {details.customerPhone || "-"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs uppercase text-muted-foreground mb-1">Courier / AWB</p>
                                    <p className="font-medium">
                                      {details.courierName || "Not shipped"}
                                    </p>
                                    <p className="text-xs font-mono text-muted-foreground">
                                      {details.awbNumber || "-"}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs uppercase text-muted-foreground mb-1">Status</p>
                                    <Badge variant={statusBadgeVariant(details.status)} className="capitalize">
                                      {formatStatus(details.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs uppercase text-muted-foreground mb-1">Payment</p>
                                    <p className="font-medium">
                                      {details.paymentMode === "COD"
                                        ? `COD • ₹${Number(details.codAmount || 0).toFixed(2)}`
                                        : "Prepaid"}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-sm">
                                  <p className="text-xs uppercase text-muted-foreground mb-1">Shipping mode</p>
                                  <p className="font-medium">
                                    {details.deliveryType || "—"}
                                  </p>
                                </div>
                              </div>

                              {details.warehouse && (
                                <div className="rounded-lg border p-4 space-y-2 text-sm">
                                  <p className="text-xs uppercase text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    Pickup location
                                  </p>
                                  <p className="font-medium">
                                    {details.warehouse?.name || "-"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {[
                                      details.warehouse?.address,
                                      details.warehouse?.city,
                                      details.warehouse?.state,
                                      details.warehouse?.pincode,
                                    ]
                                      .filter(Boolean)
                                      .join(", ") || "—"}
                                  </p>
                                  {details.warehouse?.phone && (
                                    <p className="text-xs text-muted-foreground">
                                      Phone: {details.warehouse.phone}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="rounded-lg border p-4 space-y-2 text-sm">
                                <p className="text-xs uppercase text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  Delivery (Ship To)
                                </p>
                                <p className="font-medium">{details.customerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {details.shippingAddress || "—"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {[
                                    details.shippingCity,
                                    details.shippingState,
                                    details.shippingPincode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </p>
                                {details.customerPhone && (
                                  <p className="text-xs text-muted-foreground">
                                    Phone: {details.customerPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ),
                  ];
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Pickup Location Modal */}
      <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Pickup Location</DialogTitle>
            <DialogDescription>
              Select where this order will be picked up from
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedOrderForPickup && (
              <p className="text-sm text-muted-foreground mb-4">
                Order: <span className="font-medium">{selectedOrderForPickup.orderNumber}</span>
              </p>
            )}

            {warehouses.length === 0 ? (
              <div className="text-center py-6">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No pickup locations found</p>
                <Button onClick={() => navigate("/dashboard/settings")}>
                  Create Pickup Location
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {warehouses.map((wh) => (
                  <button
                    key={wh.id}
                    onClick={() => handleAssignPickup(wh.id)}
                    disabled={isAssigning}
                    className="w-full p-4 text-left rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium">{wh.name}</p>
                      <p className="text-sm text-muted-foreground">{wh.city} • {wh.phone}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Order Details</DialogTitle>
            <DialogDescription>
              Update the customer and delivery address before shipping.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {orderBeingEdited && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Created: {new Date(orderBeingEdited.createdAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Order Number</Label>
              <Input
                value={editForm.orderNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, orderNumber: e.target.value })
                }
                placeholder="e.g. SWIFT000001"
              />
              <p className="text-xs text-muted-foreground">This ID will be sent to the courier partner when you ship.</p>
            </div>

            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={editForm.customerName}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerName: e.target.value })
                }
                placeholder="Customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Phone</Label>
              <Input
                value={editForm.customerPhone}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerPhone: e.target.value })
                }
                placeholder="+91..."
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Address</Label>
              <Textarea
                value={editForm.shippingAddress}
                onChange={(e) =>
                  setEditForm({ ...editForm, shippingAddress: e.target.value })
                }
                placeholder="Street address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={editForm.shippingCity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shippingCity: e.target.value })
                  }
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={editForm.shippingState}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shippingState: e.target.value })
                  }
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={editForm.shippingPincode}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shippingPincode: e.target.value })
                  }
                  placeholder="560001"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Raise Ticket Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise Support Ticket</DialogTitle>
            <DialogDescription>
              Create a support ticket for this order. Our team will review and resolve it.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedOrderForTicket && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Order: {selectedOrderForTicket.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Customer: {selectedOrderForTicket.customerName}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select
                value={ticketData.type}
                onValueChange={(value) => setTicketData({ ...ticketData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELIVERY_ISSUE">Delivery Issue</SelectItem>
                  <SelectItem value="WEIGHT_DISPUTE">Weight Dispute</SelectItem>
                  <SelectItem value="LOST_DAMAGED">Lost/Damaged Package</SelectItem>
                  <SelectItem value="COURIER_ESCALATION">Courier Escalation</SelectItem>
                  <SelectItem value="BILLING_ISSUE">Billing Issue</SelectItem>
                  <SelectItem value="PICKUP_ISSUE">Pickup Issue</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={ticketData.priority}
                onValueChange={(value) => setTicketData({ ...ticketData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                placeholder="Please describe the issue in detail..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowTicketModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} disabled={isCreatingTicket}>
                {isCreatingTicket ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Xpressbees Pricing Modal */}
      <Dialog open={showXpressbeesModal} onOpenChange={setShowXpressbeesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Ship via Xpressbees
            </DialogTitle>
            <DialogDescription>
              Select a shipping service for order {selectedOrderForXpressbees?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingXpressbeesPricing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-3" />
                <p className="text-muted-foreground">Loading available services...</p>
              </div>
            ) : xpressbeesServices.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No services available for this route</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check pickup and delivery pincodes
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {xpressbeesServices.map((service) => (
                  <button
                    key={service.service_id}
                    onClick={() => handleSelectXpressbeesService(service)}
                    disabled={selectingService !== null}
                    className="w-full p-4 text-left rounded-lg border hover:border-green-500 hover:bg-green-50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-base">{service.service_name}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Freight: <span className="font-medium text-foreground">₹{service.freight}</span></span>
                          <span>COD: <span className="font-medium text-foreground">₹{service.cod}</span></span>
                          {service.chargeable_weight && (
                            <span>Weight: <span className="font-medium text-foreground">{(service.chargeable_weight / 1000).toFixed(2)} kg</span></span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">₹{service.total}</p>
                        {selectingService === service.service_id ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto mt-1" />
                        ) : (
                          <p className="text-xs text-muted-foreground group-hover:text-green-600 mt-1">
                            Click to ship →
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delhivery Pricing Modal */}
      <Dialog open={showDelhiveryModal} onOpenChange={setShowDelhiveryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Ship via Delhivery
            </DialogTitle>
            <DialogDescription>
              Select shipping mode for order {selectedOrderForDelhivery?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingDelhiveryPricing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
                <p className="text-muted-foreground">Loading available services...</p>
              </div>
            ) : delhiveryServices.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No services available for this route</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check pickup and delivery pincodes
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {delhiveryServices.map((service) => (
                  <button
                    key={service.service_id}
                    onClick={() => handleSelectDelhiveryService(service)}
                    disabled={selectingDelhiveryService !== null}
                    className="w-full p-4 text-left rounded-lg border hover:border-indigo-500 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-base">{service.service_name}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Freight: <span className="font-medium text-foreground">₹{service.freight}</span></span>
                          <span>COD: <span className="font-medium text-foreground">₹{service.cod}</span></span>
                          {service.estimated_days && (
                            <span>Est: <span className="font-medium text-foreground">{service.estimated_days} days</span></span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-indigo-600">₹{service.total}</p>
                        {selectingDelhiveryService === service.service_id ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto mt-1" />
                        ) : (
                          <p className="text-xs text-muted-foreground group-hover:text-indigo-600 mt-1">
                            Click to ship →
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ekart Pickup Date Picker Dialog */}
      <Dialog open={showEkartDateModal} onOpenChange={setShowEkartDateModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              Ship via Ekart
            </DialogTitle>
            <DialogDescription>
              Select a preferred pickup date for order {selectedOrderForEkart?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Pickup Date */}
            <div>
              <p className="font-medium mb-1">Pickup Date</p>
              <p className="text-sm text-muted-foreground mb-3">
                When should Ekart pick up this shipment?
              </p>
              <div className="flex gap-3">
                {getAvailablePickupDates().map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = ekartPickupDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setEkartPickupDate(dateStr)}
                      className={`flex flex-col items-center px-5 py-3 rounded-full border-2 transition-all ${isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-2xl font-bold leading-tight">{dayNum}</span>
                      <span className="text-xs">{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-orange-600">
              Ensure the shipment is packed and label is pasted before the pickup date.
            </p>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEkartDateModal(false);
                  setSelectedOrderForEkart(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShipEkart}
                disabled={isShippingEkart || !ekartPickupDate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isShippingEkart ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Shipping...</>
                ) : (
                  'Ship & Schedule Pickup'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Innofulfill Surface/Air selection */}
      <Dialog open={showInnofulfillModal} onOpenChange={setShowInnofulfillModal}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700">
              <Truck className="h-5 w-5" />
              Ship via Innofulfill
            </DialogTitle>
            <DialogDescription>
              Choose delivery mode for order {selectedOrderForInnofulfill?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select Surface (standard) or Air (faster). Booking will use this mode.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-1 border-2 hover:border-teal-500 hover:bg-teal-50"
                onClick={() => handleShipInnofulfill('SURFACE')}
                disabled={isShippingInnofulfill}
              >
                <Truck className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">Surface</span>
                <span className="text-xs text-muted-foreground">Standard delivery</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-1 border-2 hover:border-teal-500 hover:bg-teal-50"
                onClick={() => handleShipInnofulfill('AIR')}
                disabled={isShippingInnofulfill}
              >
                <Zap className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">Air</span>
                <span className="text-xs text-muted-foreground">Faster delivery</span>
              </Button>
            </div>
            {isShippingInnofulfill && (
              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Booking shipment...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Pickup Dialog (Delhivery-style) */}
      <Dialog open={showAddToPickup} onOpenChange={setShowAddToPickup}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add to Pickup</DialogTitle>
            <DialogDescription>
              Select any existing pickup request or create new request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Selected pickup location */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Selected pickup location</p>
              <span className="inline-block px-3 py-1.5 rounded bg-indigo-100 text-indigo-800 text-sm font-medium uppercase">
                {pickupOrderData?.warehouseName || 'Warehouse'}
              </span>
            </div>

            {/* Pickup Date */}
            <div>
              <p className="font-medium mb-1">Pickup Date</p>
              <p className="text-sm text-muted-foreground mb-3">
                Pickup will be attempted during the selected Pickup Slot
              </p>
              <div className="flex gap-3">
                {getAvailablePickupDates().map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedPickupDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedPickupDate(dateStr)}
                      className={`flex flex-col items-center px-5 py-3 rounded-full border-2 transition-all ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-2xl font-bold leading-tight">{dayNum}</span>
                      <span className="text-xs">{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pickup Slot */}
            <div className="rounded-lg border p-4">
              <p className="font-medium mb-2">Default Pickup Slot</p>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedPickupSlot} onValueChange={setSelectedPickupSlot}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PICKUP_SLOTS).map(([name, time]) => (
                      <SelectItem key={name} value={name}>
                        {name} &nbsp; {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-sm text-orange-600">
              For Next Day Delivery shipments, please ensure pickup is scheduled before 6:00 PM
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Keep the shipment ready with the label pasted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddToPickup(false);
                    setPickupOrderData(null);
                  }}
                >
                  Add Later
                </Button>
                <Button
                  onClick={handleAddToPickup}
                  disabled={isSchedulingPickup || !selectedPickupDate}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {isSchedulingPickup ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling...</>
                  ) : (
                    'Add to Pickup'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Confirmation Dialog */}
      <Dialog open={showWalletConfirm} onOpenChange={(open) => {
        if (!open) { setPendingShipAction(null); }
        setShowWalletConfirm(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Confirm Shipment
            </DialogTitle>
            <DialogDescription>
              Review your wallet balance before shipping via {pendingShipCourier}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {loadingWalletCheck ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Calculating shipping cost...</p>
              </div>
            ) : walletInfo?.isPaused ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="font-semibold text-red-700">Account Paused</p>
                  <p className="text-sm text-red-600 mt-1">
                    Your account is currently paused. Contact support to resume shipping.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowWalletConfirm(false)}>
                  Close
                </Button>
              </div>
            ) : walletInfo && !walletInfo.canShip ? (
              <div className="space-y-4">
                {walletInfo.customerType === 'CREDIT' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      Shipping cost will be billed to your credit account at the end of the billing cycle.
                    </p>
                  </div>
                ) : shippingEstimate && shippingEstimate.vendorCharge > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">Shipping Cost</span>
                      <span className="text-xl font-bold text-blue-700">
                        ₹{shippingEstimate.vendorCharge.toFixed(2)}
                        {!shippingEstimate.estimateAvailable && <span className="text-xs font-normal ml-1">(est.)</span>}
                      </span>
                    </div>
                  </div>
                ) : shippingEstimate?.note ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">{shippingEstimate.note}</p>
                  </div>
                ) : null}

                {walletInfo.customerType === 'CREDIT' ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                      <p className="font-semibold text-amber-700">
                        {walletInfo.hasUnpaidInvoice ? 'Unpaid Invoice' : 'Credit Limit Exceeded'}
                      </p>
                      <p className="text-sm text-amber-600 mt-1">
                        {walletInfo.hasUnpaidInvoice
                          ? 'You have an unpaid invoice. Please pay it before shipping.'
                          : 'Your outstanding balance exceeds your credit limit.'}
                      </p>
                    </div>
                    <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-semibold">₹{(walletInfo.creditLimit || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-semibold text-orange-600">₹{(walletInfo.totalOutstanding || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">Available Credit</span>
                        <span className="font-bold text-red-600">₹{(walletInfo.availableCredit || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowWalletConfirm(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={() => { setShowWalletConfirm(false); navigate('/dashboard/billing'); }}>
                        View Invoices
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                      <p className="font-semibold text-amber-700">Insufficient Balance</p>
                      <p className="text-sm text-amber-600 mt-1">
                        Your wallet balance is too low to ship this order. Please recharge first.
                      </p>
                    </div>
                    <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Wallet Balance</span>
                        <span className="font-semibold">₹{(walletInfo.balance || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-semibold">₹{(walletInfo.creditLimit || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-bold text-red-600">₹{(walletInfo.available || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowWalletConfirm(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={() => { setShowWalletConfirm(false); navigate('/dashboard/billing'); }}>
                        Recharge Wallet
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : walletInfo ? (
              <div className="space-y-4">
                {/* Shipping cost */}
                {walletInfo.customerType === 'CREDIT' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      Shipping cost will be billed to your credit account at the end of the billing cycle.
                    </p>
                  </div>
                ) : shippingEstimate && shippingEstimate.vendorCharge > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-blue-700">Shipping Cost</span>
                        {!shippingEstimate.estimateAvailable && (
                          <p className="text-xs text-blue-500">Estimated — final cost may vary slightly</p>
                        )}
                      </div>
                      <span className="text-2xl font-bold text-blue-700">₹{shippingEstimate.vendorCharge.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      {shippingEstimate?.note || 'Shipping cost will be calculated and deducted after the shipment is created.'}
                    </p>
                  </div>
                )}

                {walletInfo.customerType === 'CREDIT' ? (
                  <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit Limit</span>
                      <span className="font-semibold">₹{(walletInfo.creditLimit || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-semibold text-orange-600">₹{(walletInfo.totalOutstanding || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Available Credit</span>
                      <span className="font-bold text-green-600">₹{(walletInfo.availableCredit || 0).toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-blue-600 pt-1">Billed monthly — no wallet deduction</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Wallet Balance</span>
                      <span className="font-semibold">₹{(walletInfo.balance || 0).toFixed(2)}</span>
                    </div>
                    {(walletInfo.creditLimit || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-semibold">₹{(walletInfo.creditLimit || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Available Balance</span>
                      <span className="font-bold text-green-600">₹{(walletInfo.available || 0).toFixed(2)}</span>
                    </div>
                    {shippingEstimate && shippingEstimate.vendorCharge > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">After Shipping</span>
                        <span className={`font-bold ${((walletInfo.available || 0) - shippingEstimate.vendorCharge) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{((walletInfo.available || 0) - shippingEstimate.vendorCharge).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Insufficient for this specific shipment */}
                {shippingEstimate && shippingEstimate.vendorCharge > 0 && !walletInfo.sufficientBalance && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {walletInfo.customerType === 'CREDIT'
                      ? 'This shipment may exceed your available credit.'
                      : 'Your balance is lower than the estimated shipping cost. You may need to recharge.'}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowWalletConfirm(false); setPendingShipAction(null); }}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleConfirmShip}>
                    Confirm & Ship
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForCancel && (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 border rounded-xl px-4 py-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order</span>
                  <span className="text-sm font-medium">{selectedOrderForCancel.orderNumber}</span>
                </div>
                {selectedOrderForCancel.awbNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">AWB</span>
                    <span className="text-sm font-mono font-medium">{selectedOrderForCancel.awbNumber}</span>
                  </div>
                )}
                {selectedOrderForCancel.courierName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Courier</span>
                    <span className="text-sm font-medium">{selectedOrderForCancel.courierName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium">{selectedOrderForCancel.status?.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {selectedOrderForCancel.awbNumber && selectedOrderForCancel.courierName && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <strong>Note:</strong> This will also cancel the shipment on {selectedOrderForCancel.courierName}. The courier may reject cancellation if the shipment is already out for delivery.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setSelectedOrderForCancel(null);
                  }}
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</>
                  ) : (
                    <><XCircle className="h-4 w-4 mr-2" /> Cancel Order</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={(open) => {
        if (!open) { setBulkCsvData([]); setBulkResults(null); }
        setShowBulkUpload(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Order Upload</DialogTitle>
            <DialogDescription>Upload a CSV file to create multiple orders at once</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={downloadSampleCsv}>
                <FileDown className="w-4 h-4 mr-2" /> Download Sample CSV
              </Button>
              <span className="text-xs text-muted-foreground">Max 500 orders per upload</span>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Choose a CSV file</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {bulkCsvData.length > 0 && !bulkResults && (
              <div className="space-y-3">
                <p className="text-sm font-medium">{bulkCsvData.length} order(s) parsed from CSV</p>
                <div className="max-h-[200px] overflow-auto border rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-left">Customer</th>
                        <th className="px-2 py-1 text-left">Phone</th>
                        <th className="px-2 py-1 text-left">City</th>
                        <th className="px-2 py-1 text-left">Pincode</th>
                        <th className="px-2 py-1 text-left">Product</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkCsvData.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">{i + 1}</td>
                          <td className="px-2 py-1">{row.customerName}</td>
                          <td className="px-2 py-1">{row.customerPhone}</td>
                          <td className="px-2 py-1">{row.shippingCity}</td>
                          <td className="px-2 py-1">{row.shippingPincode}</td>
                          <td className="px-2 py-1">{row.productName}</td>
                        </tr>
                      ))}
                      {bulkCsvData.length > 20 && (
                        <tr className="border-t">
                          <td colSpan={6} className="px-2 py-1 text-center text-muted-foreground">
                            ...and {bulkCsvData.length - 20} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Button onClick={handleBulkSubmit} disabled={bulkUploading} className="w-full gap-2">
                  {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {bulkUploading ? "Importing..." : `Import ${bulkCsvData.length} Order(s)`}
                </Button>
              </div>
            )}

            {bulkResults && (
              <div className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <div className="text-green-600 font-medium">Imported: {bulkResults.imported}</div>
                  <div className="text-red-600 font-medium">Failed: {bulkResults.failed}</div>
                  <div className="text-muted-foreground">Total: {bulkResults.total}</div>
                </div>
                {bulkResults.results?.filter((r: any) => !r.success).length > 0 && (
                  <div className="max-h-[150px] overflow-auto border rounded p-2">
                    <p className="text-xs font-medium text-red-600 mb-1">Failed rows:</p>
                    {bulkResults.results.filter((r: any) => !r.success).map((r: any) => (
                      <div key={r.row} className="text-xs text-red-600">
                        Row {r.row}: {r.error}
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" onClick={() => { setBulkCsvData([]); setBulkResults(null); }} className="w-full">
                  Upload Another File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reverse Pickup Modal */}
      <Dialog open={showReverseModal} onOpenChange={setShowReverseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              Initiate Reverse Pickup
            </DialogTitle>
            <DialogDescription>
              Create a return shipment for order {selectedOrderForReverse?.orderNumber}.
              The customer's address will be used as the pickup location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Reason *</Label>
              <Select value={reverseForm.reason} onValueChange={(v) => setReverseForm({ ...reverseForm, reason: v })}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer Return">Customer Return</SelectItem>
                  <SelectItem value="Wrong Product Sent">Wrong Product Sent</SelectItem>
                  <SelectItem value="Damaged Product">Damaged Product</SelectItem>
                  <SelectItem value="Size/Fit Issue">Size/Fit Issue</SelectItem>
                  <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                  <SelectItem value="Not as Described">Not as Described</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pickup Date (optional)</Label>
              <Input
                type="date"
                value={reverseForm.pickupDate}
                onChange={(e) => setReverseForm({ ...reverseForm, pickupDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Updated Phone (optional)</Label>
              <Input
                type="tel"
                placeholder="10-digit phone number"
                value={reverseForm.phone}
                onChange={(e) => setReverseForm({ ...reverseForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Updated Address (optional)</Label>
              <Textarea
                placeholder="Updated pickup address (leave empty to use original)"
                value={reverseForm.address}
                onChange={(e) => setReverseForm({ ...reverseForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <Label className="text-sm font-medium">QC Required?</Label>
                <p className="text-xs text-muted-foreground">Quality check on return (₹{qcChargeValue})</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={qcEnabled}
                onClick={() => setQcEnabled(!qcEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${qcEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${qcEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </button>
            </div>
            {qcEnabled && (
              <div className="text-xs text-purple-700 bg-purple-50/50 px-3 py-2 rounded border border-purple-100">
                QC Charge: <strong>₹{qcChargeValue}</strong> will be added to the reverse shipment cost.
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowReverseModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!reverseForm.reason || isCreatingReverse}
                onClick={async () => {
                  if (!selectedOrderForReverse) return;
                  setIsCreatingReverse(true);
                  try {
                    const res = await reverseApi.initiate(selectedOrderForReverse.id, {
                      reason: reverseForm.reason,
                      pickupDate: reverseForm.pickupDate || undefined,
                      phone: reverseForm.phone || undefined,
                      address: reverseForm.address || undefined,
                      qcRequired: qcEnabled,
                    });
                    if (res.data.success) {
                      toast.success(res.data.message || 'Reverse pickup initiated!');
                      setShowReverseModal(false);
                      loadOrders();
                    } else {
                      toast.error(res.data.message || 'Failed to create reverse pickup');
                    }
                  } catch (e: any) {
                    toast.error(e?.response?.data?.error || e?.message || 'Failed to create reverse pickup');
                  } finally {
                    setIsCreatingReverse(false);
                  }
                }}
              >
                {isCreatingReverse ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><RotateCcw className="h-4 w-4 mr-2" /> Create Reverse</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Courier Comparison Modal */}
      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Select Courier Partner
            </DialogTitle>
            <DialogDescription>
              Compare shipping rates across all available couriers
            </DialogDescription>
          </DialogHeader>

          {loadingCompare ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Fetching rates from all couriers...</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Order Info Summary */}
              {compareOrderInfo && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-muted-foreground text-xs block">Pickup</span>
                    <span className="font-semibold">{compareOrderInfo.pickupPincode}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-muted-foreground text-xs block">Delivery</span>
                    <span className="font-semibold">{compareOrderInfo.deliveryPincode}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-muted-foreground text-xs block">Weight</span>
                    <span className="font-semibold">{compareOrderInfo.weight} kg</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-muted-foreground text-xs block">Payment</span>
                    <span className="font-semibold">{compareOrderInfo.paymentMode}</span>
                  </div>
                </div>
              )}

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                {compareResults.filter(c => c.available).length} of {compareResults.length} couriers available
              </p>

              {/* Courier List */}
              <div className="space-y-2">
                {compareResults.map((courier) => (
                  <div
                    key={courier.courierName}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      courier.available
                        ? 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Courier Logo */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {({
                        DELHIVERY: <img src="/delhivery-logo.webp" alt="Delhivery" className="w-9 h-9 object-contain" />,
                        XPRESSBEES: <img src="/xpresssbees.png" alt="Xpressbees" className="w-9 h-9 object-contain" />,
                        EKART: <img src="/ekart-logo.svg" alt="Ekart" className="w-9 h-9 object-contain" />,
                        INNOFULFILL: <img src="/innofullfil.png" alt="Innofulfill" className="w-9 h-9 object-contain" />,
                        BLITZ: <Zap className="w-5 h-5 text-orange-500" />,
                      } as Record<string, React.ReactNode>)[courier.courierName] || <Package className="w-5 h-5 text-gray-400" />}
                    </div>

                    {/* Courier Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{courier.label}</span>
                        {compareResults.indexOf(courier) === 0 && courier.available && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Cheapest</Badge>
                        )}
                      </div>
                      {courier.available ? (
                        <span className="text-xs text-muted-foreground">
                          {courier.estimatedDays ? `Est. ${courier.estimatedDays} day${courier.estimatedDays > 1 ? 's' : ''}` : 'Surface'}
                          {' · '}{courier.weight} kg
                        </span>
                      ) : (
                        <span className="text-xs text-red-500">{courier.error || 'Not available'}</span>
                      )}
                    </div>

                    {/* Price */}
                    {courier.available && (
                      <div className="text-right shrink-0">
                        {compareWallet?.customerType === 'CREDIT' ? (
                          <span className="text-xs text-blue-600">Billed to credit</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">₹{courier.vendorCharge?.toFixed(2)}</span>
                        )}
                      </div>
                    )}

                    {/* Ship Button */}
                    <div className="shrink-0">
                      {courier.available ? (
                        <Button
                          size="sm"
                          onClick={() => shipFromCompare(courier.courierName)}
                          disabled={!!shippingFromCompare}
                          className="min-w-[80px]"
                        >
                          {shippingFromCompare === courier.courierName ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Ship'
                          )}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="min-w-[80px] opacity-40">
                          N/A
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Wallet info for CASH */}
              {compareWallet?.customerType === 'CASH' && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Wallet Balance</span>
                  <span className="font-semibold">₹{(compareWallet.available || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
