import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  RefreshCw,
  ArrowRight,
  Calendar,
  Clock,
} from "lucide-react";
import { dashboardApi, ordersApi, pickupsApi } from "@/lib/api";

type DashboardStats = {
  totalOrders: number;
  todayOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  rtoOrders: number;
  totalPickups: number;
  pendingPickups: number;
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
  productValue?: number;
};

type Pickup = {
  id: string;
  warehouseId: string;
  scheduledDate: string;
  status: string;
  expectedPickups: number;
  pickedOrders?: number;
};

type AnalyticsData = {
  date: string;
  totalOrders: number;
  delivered: number;
  inTransit: number;
  rto: number;
  revenue: number;
};

const getStatusBadgeVariant = (status: string) => {
  const normalized = status?.toUpperCase();
  if (["DELIVERED"].includes(normalized)) return "secondary" as const;
  if (["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(normalized))
    return "outline" as const;
  if (["PENDING", "PROCESSING", "MANIFESTED"].includes(normalized))
    return "default" as const;
  if (["RTO", "FAILED"].includes(normalized)) return "destructive" as const;
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all dashboard data in parallel
      const [overviewRes, ordersRes, pickupsRes, analyticsRes] = await Promise.all([
        dashboardApi.overview(),
        ordersApi.list({ status: '', page: 1, limit: 10 }),
        pickupsApi.list({ status: '' }),
        dashboardApi.analytics(),
      ]);

      // Set stats
      setStats({
        totalOrders: overviewRes.data.totalOrders || 0,
        todayOrders: overviewRes.data.todayOrders || 0,
        activeOrders: overviewRes.data.activeOrders || 0,
        deliveredOrders: overviewRes.data.deliveredOrders || 0,
        rtoOrders: overviewRes.data.rtoOrders || 0,
        totalPickups: overviewRes.data.totalPickups || 0,
        pendingPickups: overviewRes.data.pendingPickups || 0,
      });

      // Set recent orders
      setOrders(overviewRes.data.recentOrders || ordersRes.data.orders || []);

      // Set pickups
      setPickups(overviewRes.data.upcomingPickups || pickupsRes.data.pickups || []);

      // Set analytics data
      setAnalytics(analyticsRes.data.orderTrends || []);
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to load dashboard";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time logistics overview with Delhivery integration
          </p>
        </div>
        <Button onClick={loadDashboardData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
            <p className="text-xs text-muted-foreground">New orders today</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Moving right now</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.deliveredOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RTO Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rtoOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Return to origin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPickups || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPickups || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Trends (Last 7 Days)</CardTitle>
            <CardDescription>
              Total orders, deliveries, in-transit, and RTO cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalOrders"
                  stroke="#3b82f6"
                  name="Total Orders"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#10b981"
                  name="Delivered"
                />
                <Line
                  type="monotone"
                  dataKey="inTransit"
                  stroke="#f59e0b"
                  name="In Transit"
                />
                <Line type="monotone" dataKey="rto" stroke="#ef4444" name="RTO" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders with Delhivery Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Live orders with Delhivery tracking</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/orders")}
            className="gap-2"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet. Create your first order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>AWB (Delhivery)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-blue-600">
                        {order.orderNumber || order.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customerName || "-"}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {[order.shippingCity, order.shippingState, order.shippingPincode]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.awbNumber ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {order.awbNumber}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/dashboard/tracking?awb=${order.awbNumber}`)
                              }
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Track
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.paymentMode === "COD"
                          ? `₹${Number(order.codAmount || 0).toFixed(0)}`
                          : order.productValue
                            ? `₹${Number(order.productValue).toFixed(0)}`
                            : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Pickups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Pickups</CardTitle>
            <CardDescription>Scheduled pickups from your warehouses</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/pickup")}
            className="gap-2"
          >
            Manage Pickups <ArrowRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {pickups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pickups scheduled. Schedule a pickup.
            </div>
          ) : (
            <div className="grid gap-3">
              {pickups.map((pickup) => (
                <div
                  key={pickup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div>
                    <div className="font-medium">Pickup {pickup.id.slice(0, 8)}</div>
                    <div className="text-sm text-muted-foreground">
                      {pickup.scheduledDate
                        ? new Date(pickup.scheduledDate).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">
                        {pickup.pickedOrders || 0} / {pickup.expectedPickups}
                      </div>
                      <div className="text-xs text-muted-foreground">Picked</div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(pickup.status)}>
                      {formatStatus(pickup.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button
          onClick={() => navigate("/dashboard/create-order")}
          className="h-16 text-base"
        >
          <Package className="w-5 h-5 mr-2" />
          Create Order
        </Button>
        <Button
          onClick={() => navigate("/dashboard/orders")}
          variant="outline"
          className="h-16 text-base"
        >
          <Truck className="w-5 h-5 mr-2" />
          View All Orders
        </Button>
        <Button
          onClick={() => navigate("/dashboard/tracking")}
          variant="outline"
          className="h-16 text-base"
        >
          <MapPin className="w-5 h-5 mr-2" />
          Track Shipment
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
