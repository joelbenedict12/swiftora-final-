import { useState } from "react";
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
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";

const Analytics = () => {
  const [dateRange, setDateRange] = useState("30d");

  const handleExportReport = () => {
    toast.success("Exporting analytics report...");
    // Simulate export
    setTimeout(() => {
      toast.success("Report exported successfully");
    }, 1500);
  };

  // Order Volume Data
  const orderVolumeData = [
    { date: "Week 1", orders: 1200, delivered: 1150, rto: 50 },
    { date: "Week 2", orders: 1500, delivered: 1420, rto: 80 },
    { date: "Week 3", orders: 1800, delivered: 1700, rto: 100 },
    { date: "Week 4", orders: 1600, delivered: 1520, rto: 80 },
  ];

  // Delivery Performance
  const deliveryPerformance = [
    { courier: "Delhivery", otd: 98.5, avgDays: 2.1, success: 98.2 },
    { courier: "BlueDart", otd: 97.2, avgDays: 2.3, success: 97.5 },
    { courier: "Shiprocket", otd: 96.8, avgDays: 2.5, success: 96.8 },
    { courier: "DTDC", otd: 95.5, avgDays: 2.8, success: 95.2 },
  ];

  // Revenue Trends
  const revenueData = [
    { month: "Jan", revenue: 245000, cost: 180000, profit: 65000 },
    { month: "Feb", revenue: 280000, cost: 200000, profit: 80000 },
    { month: "Mar", revenue: 320000, cost: 225000, profit: 95000 },
    { month: "Apr", revenue: 295000, cost: 210000, profit: 85000 },
  ];

  // COD Remittance
  const codRemittance = [
    { week: "Week 1", collected: 450000, remitted: 420000, pending: 30000 },
    { week: "Week 2", collected: 520000, remitted: 500000, pending: 20000 },
    { week: "Week 3", collected: 480000, remitted: 460000, pending: 20000 },
    { week: "Week 4", collected: 550000, remitted: 530000, pending: 20000 },
  ];

  // NDR & RTO Analysis
  const ndrRtoData = [
    { reason: "Address Issue", count: 45, percentage: 35 },
    { reason: "Customer Unavailable", count: 30, percentage: 23 },
    { reason: "Wrong Phone", count: 25, percentage: 19 },
    { reason: "Refused Delivery", count: 15, percentage: 12 },
    { reason: "Other", count: 13, percentage: 10 },
  ];

  // Weight Discrepancy
  const weightDiscrepancy = [
    { courier: "Delhivery", orders: 1200, discrepancies: 12, rate: 1.0 },
    { courier: "BlueDart", orders: 800, discrepancies: 16, rate: 2.0 },
    // { courier: "Shiprocket", orders: 600, discrepancies: 18, rate: 3.0 },
    { courier: "DTDC", orders: 400, discrepancies: 12, rate: 3.0 },
  ];

  // Appointment Delivery Analytics
  const appointmentDeliveryData = [
    { month: "Jan", appointments: 280, completed: 265, pending: 15 },
    { month: "Feb", appointments: 320, completed: 305, pending: 15 },
    { month: "Mar", appointments: 350, completed: 335, pending: 15 },
    { month: "Apr", appointments: 290, completed: 275, pending: 15 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Analytics & Reports
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive insights into your shipping operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-gray-200 shadow-sm hover:bg-gray-50"
            onClick={handleExportReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Shipments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">6,100</div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Appointment Deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1,240</div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-green-600">+8.2%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>On-Time Delivery (OTD)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">97.8%</div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-green-600">+2.1%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>RTO Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3.2%</div>
            <div className="flex items-center text-xs mt-1">
              <ArrowDownRight className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-green-600">-0.5%</span>
              <span className="text-gray-500 ml-1">reduction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial Analytics</TabsTrigger>
          <TabsTrigger value="courier">Courier Performance</TabsTrigger>
          <TabsTrigger value="ndr-rto">NDR & RTO Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Order Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Volume Trends</CardTitle>
              <CardDescription>
                Orders, deliveries, and RTO trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={orderVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Total Orders"
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Delivered"
                  />
                  <Area
                    type="monotone"
                    dataKey="rto"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="RTO"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Revenue, costs, and profit trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="cost" fill="#f59e0b" name="Cost" />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Appointment Delivery Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Delivery Analytics</CardTitle>
              <CardDescription>
                Appointment delivery trends and completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={appointmentDeliveryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Total Appointments"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Completed"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Pending"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Performance Tab */}
        <TabsContent value="delivery" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance by Courier</CardTitle>
              <CardDescription>
                On-time delivery rates and average delivery times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryPerformance.map((courier, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{courier.courier}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          OTD: <strong>{courier.otd}%</strong>
                        </span>
                        <span>
                          Avg: <strong>{courier.avgDays} days</strong>
                        </span>
                        <span>
                          Success: <strong>{courier.success}%</strong>
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${courier.otd}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Same Day</span>
                    <span className="font-semibold">5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1 Day</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">2 Days</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">3 Days</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">4+ Days</span>
                    <span className="font-semibold">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delay Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">No Delay</span>
                    <span className="font-semibold text-green-600">97.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1 Day Delay</span>
                    <span className="font-semibold text-yellow-600">1.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">2+ Days Delay</span>
                    <span className="font-semibold text-red-600">0.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Cost Trends</CardTitle>
              <CardDescription>
                Monthly revenue, costs, and profit analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Cost"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>COD Remittance Tracking</CardTitle>
              <CardDescription>
                COD collection and remittance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={codRemittance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="collected" fill="#3b82f6" name="Collected" />
                  <Bar dataKey="remitted" fill="#10b981" name="Remitted" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹13,40,000</div>
                <div className="text-xs text-green-600 mt-1">
                  +12.5% vs last period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹8,15,000</div>
                <div className="text-xs text-gray-600 mt-1">
                  Shipping charges
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹5,25,000
                </div>
                <div className="text-xs text-green-600 mt-1">39.2% margin</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courier Performance Tab */}
        <TabsContent value="courier" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Courier Performance Comparison</CardTitle>
              <CardDescription>
                Comprehensive courier metrics and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Courier</th>
                      <th className="text-left p-3 font-semibold">Orders</th>
                      <th className="text-left p-3 font-semibold">OTD Rate</th>
                      <th className="text-left p-3 font-semibold">
                        Success Rate
                      </th>
                      <th className="text-left p-3 font-semibold">Avg Days</th>
                      <th className="text-left p-3 font-semibold">RTO Rate</th>
                      <th className="text-left p-3 font-semibold">
                        Complaints
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryPerformance.map((courier, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{courier.courier}</td>
                        <td className="p-3">
                          {index === 0
                            ? 1200
                            : index === 1
                            ? 800
                            : index === 2
                            ? 600
                            : 400}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold">{courier.otd}%</span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-green-600">
                            {courier.success}%
                          </span>
                        </td>
                        <td className="p-3">{courier.avgDays} days</td>
                        <td className="p-3">
                          <span className="text-red-600">
                            {index === 0
                              ? 1.8
                              : index === 1
                              ? 2.5
                              : index === 2
                              ? 3.2
                              : 4.8}
                            %
                          </span>
                        </td>
                        <td className="p-3">
                          {index === 0
                            ? 5
                            : index === 1
                            ? 8
                            : index === 2
                            ? 12
                            : 15}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight Discrepancy Analysis</CardTitle>
              <CardDescription>Weight discrepancies by courier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weightDiscrepancy.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.courier}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          Orders: <strong>{item.orders}</strong>
                        </span>
                        <span>
                          Discrepancies:{" "}
                          <strong className="text-red-600">
                            {item.discrepancies}
                          </strong>
                        </span>
                        <span>
                          Rate: <strong>{item.rate}%</strong>
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${item.rate * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NDR & RTO Analysis Tab */}
        <TabsContent value="ndr-rto" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>NDR Reasons Distribution</CardTitle>
                <CardDescription>
                  Top reasons for non-delivery reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ndrRtoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {ndrRtoData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NDR Reasons Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ndrRtoData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {item.reason}
                        </span>
                        <span className="text-sm font-semibold">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>RTO Trends</CardTitle>
              <CardDescription>
                Return to origin trends and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={orderVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rto"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="RTO Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
