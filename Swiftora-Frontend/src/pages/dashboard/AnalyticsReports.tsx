import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const AnalyticsReports = () => {
  // Mock Data
  const orderVolumeData = [
    { week: "Week 1", totalOrders: 3200, delivered: 2800, rto: 200 },
    { week: "Week 2", totalOrders: 3100, delivered: 2700, rto: 150 },
    { week: "Week 3", totalOrders: 3400, delivered: 2900, rto: 250 },
    { week: "Week 4", totalOrders: 3300, delivered: 2850, rto: 180 },
    { week: "Week 5", totalOrders: 3500, delivered: 3000, rto: 220 },
    { week: "Week 6", totalOrders: 3600, delivered: 3100, rto: 300 },
  ];

  const revenueOverviewData = [
    { name: "Jan", revenue: 100000, cost: 60000, profit: 40000 },
    { name: "Feb", revenue: 120000, cost: 70000, profit: 50000 },
    { name: "Mar", revenue: 140000, cost: 80000, profit: 60000 },
  ];

  const deliveryPerformanceData = [
    { name: "Delhivery", delivered: 400, rto: 24, delayed: 12 },
    { name: "BlueDart", delivered: 300, rto: 13, delayed: 8 },
    { name: "XpressBees", delivered: 200, rto: 9, delayed: 5 },
  ];

  const deliveryTimeData = [
    { days: "1-2", count: 120 },
    { days: "2-3", count: 300 },
    { days: "3-5", count: 200 },
    { days: "5+", count: 50 },
  ];

  const delayAnalysisData = [
    { reason: "Incorrect Address", count: 25 },
    { reason: "Customer Not Available", count: 40 },
    { reason: "Weather Conditions", count: 10 },
  ];

  const revenueCostData = [
    { name: "Jan", revenue: 4000, cost: 2400 },
    { name: "Feb", revenue: 3000, cost: 1398 },
    { name: "Mar", revenue: 2000, cost: 9800 },
    { name: "Apr", revenue: 2780, cost: 3908 },
    { name: "May", revenue: 1890, cost: 4800 },
    { name: "Jun", revenue: 2390, cost: 3800 },
  ];

  const codRemittanceData = [
    { orderId: "123", amount: 1500, status: "Remitted" },
    { orderId: "124", amount: 2500, status: "Pending" },
    { orderId: "125", amount: 1000, status: "Remitted" },
    { orderId: "126", amount: 1070, status: "Remitted" },
  ];

  const courierComparisonData = [
    { courier: "Delhivery", onTime: "95%", avgCost: "₹50", rtoRate: "1.2%" },
    { courier: "BlueDart", onTime: "98%", avgCost: "₹55", rtoRate: "0.8%" },
    { courier: "XpressBees", onTime: "92%", avgCost: "₹48", rtoRate: "1.5%" },
  ];

  const weightDiscrepancyData = [
    { orderId: "123", declared: "1kg", actual: "1.2kg", difference: "0.2kg" },
    { orderId: "124", declared: "0.5kg", actual: "0.5kg", difference: "0kg" },
    { orderId: "125", declared: "2kg", actual: "2.5kg", difference: "0.5kg" },
    { orderId: "126", declared: "1.4kg", actual: "2.0kg", difference: "0.6kg" },
  ];

  const ndrReasonsData = [
    { name: "Incorrect Address", value: 400 },
    { name: "Customer Not Available", value: 300 },
    { name: "Refused Delivery", value: 300 },
    { name: "Other", value: 200 },
  ];

  const rtoTrendsData = [
    { name: "Jan", rto: 1.5 },
    { name: "Feb", rto: 1.2 },
    { name: "Mar", rto: 1.8 },
    { name: "Apr", rto: 1.6 },
    { name: "May", rto: 1.4 },
    { name: "Jun", rto: 1.1 },
  ];

  const revenueByProductData = [
    { name: "cloths", revenue: 12000 },
    { name: "Apparel", revenue: 9000 },
    { name: "Home Goods", revenue: 7500 },
    { name: "Books", revenue: 4000 },
    { name: "Beauty", revenue: 6000 },
  ];

  const [loading, setLoading] = useState(false);

  const handleExportCSV = () => {
    setLoading(true);

    const allData = [
      ["Order Volume Trends"],
      ["Week", "Total Orders", "Delivered", "RTO"],
      ...orderVolumeData.map((d) => [
        d.week,
        d.totalOrders,
        d.delivered,
        d.rto,
      ]),
      [],
      ["Revenue Overview"],
      ...revenueOverviewData.map((d) => [d.name, d.revenue]),
      [],
      ["Delivery Performance by Courier"],
      ["Name", "Delivered", "RTO", "Delayed"],
      ...deliveryPerformanceData.map((d) => [
        d.name,
        d.delivered,
        d.rto,
        d.delayed,
      ]),
      [],
      ["Delivery Time Distribution"],
      ["Days", "Count"],
      ...deliveryTimeData.map((d) => [d.days, d.count]),
      [],
      ["Delay Analysis"],
      ["Reason", "Count"],
      ...delayAnalysisData.map((d) => [d.reason, d.count]),
      [],
      ["Revenue & Cost Trends"],
      ["Name", "Revenue", "Cost"],
      ...revenueCostData.map((d) => [d.name, d.revenue, d.cost]),
      [],
      ["COD Remittance Tracking"],
      ["Order ID", "Amount", "Status"],
      ...codRemittanceData.map((d) => [d.orderId, d.amount, d.status]),
      [],
      ["Courier Performance Comparison"],
      ["Courier", "On-time %", "Avg. Cost", "RTO Rate"],
      ...courierComparisonData.map((d) => [
        d.courier,
        d.onTime,
        d.avgCost,
        d.rtoRate,
      ]),
      [],
      ["Weight Discrepancy Analysis"],
      ["Order ID", "Declared", "Actual", "Difference"],
      ...weightDiscrepancyData.map((d) => [
        d.orderId,
        d.declared,
        d.actual,
        d.difference,
      ]),
      [],
      ["NDR Reasons Distribution"],
      ["Reason", "Count"],
      ...ndrReasonsData.map((d) => [d.name, d.value]),
      [],
      ["RTO Trends"],
      ["Name", "RTO"],
      ...rtoTrendsData.map((d) => [d.name, d.rto]),
    ];

    const csvContent = allData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "analytics_reports.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setLoading(false);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const codRemittanceChartData = codRemittanceData.reduce((acc, curr) => {
    const existing = acc.find((item) => item.status === curr.status);
    if (existing) {
      existing.amount += curr.amount;
    } else {
      acc.push({ status: curr.status, amount: curr.amount });
    }
    return acc;
  }, [] as { status: string; amount: number }[]);

  return (
    <div className="space-y-8 ">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Analytics & Reports
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Exporting..." : "Export Reports"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              On-time delivery
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.2%</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg delivery time
            </CardTitle>
            <Clock className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 days</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              -0.3 days from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RTO Rate</CardTitle>
            <TrendingDown className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2%</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              -0.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">NDR Rate</CardTitle>
            <XCircle className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.8%</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              -0.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="delivery-performance">
            Delivery performance
          </TabsTrigger>
          <TabsTrigger value="financial-analytics">
            Financial analytics
          </TabsTrigger>
          <TabsTrigger value="courier-performances">
            Courier performances
          </TabsTrigger>
          <TabsTrigger value="ndr-rto-analysis">NDR & RTO analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={orderVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 3600]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalOrders"
                      stackId="1"
                      stroke="#0000FF"
                      fill="#0000FF"
                      name="Total Orders"
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stackId="1"
                      stroke="#00FF00"
                      fill="#00FF00"
                      name="Delivered"
                    />
                    <Area
                      type="monotone"
                      dataKey="rto"
                      stackId="1"
                      stroke="#FF0000"
                      fill="#FF0000"
                      name="RTO"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueOverviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 320000]} />
                    <Tooltip />
                    <Legend iconType="circle" />
                    <Bar dataKey="revenue" fill="#0000FF" name="Revenue" />
                    <Bar dataKey="cost" fill="#FFA500" name="Cost" />
                    <Bar dataKey="profit" fill="#00FF00" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="delivery-performance">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Delivery Performance by Courier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deliveryPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="delivered" fill="#82ca9d" />
                    <Bar dataKey="rto" fill="#ffc658" />
                    <Bar dataKey="delayed" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Delivery Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deliveryTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="days" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Delay Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delayAnalysisData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{data.reason}</TableCell>
                        <TableCell>{data.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="financial-analytics">
          <div className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹1,25,000</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Costs</CardTitle>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹85,000</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Net Profit</CardTitle>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹40,000</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueCostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="cost" stroke="#ff8042" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 space-x-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Product Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByProductData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>COD Remittance Tracking</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={codRemittanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codRemittanceData.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell>{data.orderId}</TableCell>
                          <TableCell>{data.amount}</TableCell>
                          <TableCell>{data.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="courier-performances">
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Courier Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Courier</TableHead>
                      <TableHead>On-time %</TableHead>
                      <TableHead>Avg. Cost</TableHead>
                      <TableHead>RTO Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courierComparisonData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{data.courier}</TableCell>
                        <TableCell>{data.onTime}</TableCell>
                        <TableCell>{data.avgCost}</TableCell>
                        <TableCell>{data.rtoRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Weight Discrepancy Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Declared</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weightDiscrepancyData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{data.orderId}</TableCell>
                        <TableCell>{data.declared}</TableCell>
                        <TableCell>{data.actual}</TableCell>
                        <TableCell>{data.difference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="ndr-rto-analysis">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>NDR Reasons Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ndrReasonsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {ndrReasonsData.map((entry, index) => (
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
                <CardTitle>RTO Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rtoTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rto" stroke="#ff8042" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>NDR Reasons Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ndrReasonsData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{data.name}</TableCell>
                        <TableCell>{data.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsReports;
