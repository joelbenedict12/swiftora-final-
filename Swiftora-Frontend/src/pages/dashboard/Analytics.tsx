import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  Package,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api";

type TrendEntry = {
  date: string;
  totalOrders: number;
  delivered: number;
  inTransit: number;
  rto: number;
  revenue: number;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const Analytics = () => {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TrendEntry[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.analytics({ period: dateRange });
      const d = res.data;
      setTrends(d.orderTrends || []);
      setStatusCounts(d.statusCounts || {});
      setTotal(d.total || 0);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const totalDelivered = Object.entries(statusCounts)
    .filter(([k]) => k === "DELIVERED")
    .reduce((s, [, v]) => s + v, 0);
  const totalRTO = Object.entries(statusCounts)
    .filter(([k]) => ["RTO", "RTO_DELIVERED"].includes(k))
    .reduce((s, [, v]) => s + v, 0);
  const totalInTransit = Object.entries(statusCounts)
    .filter(([k]) => ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(k))
    .reduce((s, [, v]) => s + v, 0);
  const deliveryRate = total > 0 ? ((totalDelivered / total) * 100).toFixed(1) : "0";
  const rtoRate = total > 0 ? ((totalRTO / total) * 100).toFixed(1) : "0";

  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const totalRevenue = trends.reduce((s, t) => s + t.revenue, 0);

  const handleExportReport = () => {
    const csvRows = ["Date,Total Orders,Delivered,In Transit,RTO,Revenue"];
    trends.forEach((t) => {
      csvRows.push(`${t.date},${t.totalOrders},${t.delivered},${t.inTransit},${t.rto},${t.revenue}`);
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Insights into your shipping operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Delivered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalDelivered}</div>
            <div className="text-xs text-muted-foreground">{deliveryRate}% rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">In Transit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalInTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">RTO</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalRTO}</div>
            <div className="text-xs text-muted-foreground">{rtoRate}% rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">COD Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalRevenue > 0 ? `₹${totalRevenue.toLocaleString("en-IN")}` : "₹0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Order Trends</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Order Trends */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Volume Trends</CardTitle>
              <CardDescription>Orders, deliveries, and RTO over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No order data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalOrders" stroke="#3b82f6" name="Total Orders" strokeWidth={2} />
                    <Line type="monotone" dataKey="delivered" stroke="#10b981" name="Delivered" strokeWidth={2} />
                    <Line type="monotone" dataKey="inTransit" stroke="#f59e0b" name="In Transit" />
                    <Line type="monotone" dataKey="rto" stroke="#ef4444" name="RTO" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Orders</CardTitle>
              <CardDescription>Bar chart of daily order counts</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalOrders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="delivered" fill="#10b981" name="Delivered" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="status" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Breakdown of all orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusPieData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {statusPieData.map((_: any, idx: number) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Counts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status === "DELIVERED" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status) && <Truck className="w-4 h-4 text-orange-500" />}
                        {["RTO", "RTO_DELIVERED"].includes(status) && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {!["DELIVERED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "RTO", "RTO_DELIVERED"].includes(status) && <Package className="w-4 h-4 text-blue-500" />}
                        <span className="text-sm">{status.replace(/_/g, " ")}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>COD Revenue Trend</CardTitle>
              <CardDescription>Revenue from delivered COD orders</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={trends.filter((t) => t.revenue > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
