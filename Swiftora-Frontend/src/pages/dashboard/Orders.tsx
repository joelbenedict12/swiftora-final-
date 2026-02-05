import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FileText,
  XCircle,
  Building,
  Zap,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { ordersApi, warehousesApi, ticketsApi } from "@/lib/api";
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

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  awbNumber?: string | null;
  status: string;
  createdAt: string;
  paymentMode?: string;
  codAmount?: number | null;
  warehouse?: {
    id: string;
    name: string;
  } | null;
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
  if (["IN_TRANSIT", "READY_TO_SHIP", "OUT_FOR_DELIVERY"].includes(normalized))
    return "outline" as const;
  if (["PENDING", "PROCESSING", "MANIFESTED"].includes(normalized))
    return "default" as const;
  if (["RTO", "RTO_DELIVERED", "FAILED", "CANCELLED"].includes(normalized))
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.list();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
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
        toast.success(response.data.message || "Pickup location assigned!");
        setShowPickupModal(false);
        setSelectedOrderForPickup(null);
        loadOrders();
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

  const handleShipToDelhivery = async (orderId: string) => {
    try {
      setShippingOrderId(orderId);
      const response = await ordersApi.shipToDelhivery(orderId);

      if (response.data.success) {
        toast.success(`Shipped via Delhivery! AWB: ${response.data.awbNumber}`);
        loadOrders();
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

  const handleShipToBlitz = async (orderId: string) => {
    try {
      setShippingOrderId(orderId);
      const response = await ordersApi.shipToBlitz(orderId);

      if (response.data.success) {
        toast.success(`Shipped via Blitz! AWB: ${response.data.awbNumber}`);
        loadOrders();
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

  const handleShipToEkart = async (orderId: string) => {
    try {
      setShippingOrderId(orderId);
      const response = await ordersApi.shipToEkart(orderId);

      if (response.data.success) {
        toast.success(`Shipped via Ekart! AWB: ${response.data.awbNumber}`);
        loadOrders();
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
      const response = await ordersApi.shipToXpressbees(selectedOrderForXpressbees.id);

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
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rto">RTO</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found. Create your first order.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filtered.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.orderNumber || order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName || "-"}</div>
                      <div className="text-sm text-muted-foreground">{order.customerPhone || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[order.shippingCity, order.shippingState, order.shippingPincode]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(order.status)} className="capitalize">
                        {formatStatus(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.awbNumber || "-"}</TableCell>
                    <TableCell>
                      {order.paymentMode === "COD"
                        ? `₹${Number(order.codAmount || 0).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!order.awbNumber && (
                            <DropdownMenuItem
                              onClick={() => openPickupModal(order)}
                              className="gap-2"
                            >
                              <Building className="h-4 w-4" />
                              Assign Pickup Location
                            </DropdownMenuItem>
                          )}
                          {!order.awbNumber && (
                            <DropdownMenuItem
                              onClick={() => handleShipToDelhivery(order.id)}
                              disabled={shippingOrderId === order.id}
                              className="gap-2 text-blue-600"
                            >
                              <Send className="h-4 w-4" />
                              {shippingOrderId === order.id ? "Shipping..." : "Ship to Delhivery"}
                            </DropdownMenuItem>
                          )}
                          {!order.awbNumber && (
                            <DropdownMenuItem
                              onClick={() => handleShipToBlitz(order.id)}
                              disabled={shippingOrderId === order.id}
                              className="gap-2 text-orange-600"
                            >
                              <Zap className="h-4 w-4" />
                              {shippingOrderId === order.id ? "Shipping..." : "Ship to Blitz"}
                            </DropdownMenuItem>
                          )}
                          {!order.awbNumber && (
                            <DropdownMenuItem
                              onClick={() => handleShipToEkart(order.id)}
                              disabled={shippingOrderId === order.id}
                              className="gap-2 text-purple-600"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              {shippingOrderId === order.id ? "Shipping..." : "Ship to Ekart"}
                            </DropdownMenuItem>
                          )}
                          {/* Xpressbees option */}
                          {!order.awbNumber && order.warehouse && (
                            <DropdownMenuItem
                              onClick={() => openXpressbeesModal(order)}
                              className="gap-2 text-green-600"
                            >
                              <Truck className="h-4 w-4" />
                              Ship via Xpressbees
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2">
                            <FileText className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {order.awbNumber && (
                            <DropdownMenuItem className="gap-2">
                              <Truck className="h-4 w-4" />
                              Track Shipment
                            </DropdownMenuItem>
                          )}
                          {!order.awbNumber && order.status === "PENDING" && (
                            <DropdownMenuItem className="gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              Cancel Order
                            </DropdownMenuItem>
                          )}
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
                  </TableRow>
                ))}
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
    </div>
  );
};

export default Orders;

