import { useState, useEffect } from "react";
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
  ResponsiveContainer,
  Legend,
} from "recharts";
import { adminApi } from "../../lib/api";
import "./Dashboard.css";

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  shipmentsToday: number;
  shipmentsThisMonth: number;
  revenueThisMonth: number;
  totalRevenue: number;
  totalCommission: number;
  totalWalletBalance: number;
  totalOutstandingCredit: number;
}

interface ChartData {
  name: string;
  orders?: number;
  revenue?: number;
}

interface CourierData {
  courier: string;
  count: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  revenue: number;
  orders: number;
}

interface RecentOrder {
  id: string;
  user: string;
  vendor: string;
  amount: string;
  status: string;
}

const COURIER_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ordersData, setOrdersData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [courierData, setCourierData] = useState<CourierData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [statsRes, ordersChartRes, revenueChartRes, recentOrdersRes, courierRes, topCustRes] =
          await Promise.all([
            adminApi.getDashboardStats(),
            adminApi.getOrdersChart(),
            adminApi.getRevenueChart(),
            adminApi.getRecentOrders(),
            adminApi.getCourierDistribution(),
            adminApi.getTopCustomers(),
          ]);

        setStats(statsRes.data);
        setOrdersData(ordersChartRes.data);
        setRevenueData(revenueChartRes.data);
        setRecentActivity(recentOrdersRes.data);
        setCourierData(courierRes.data);
        setTopCustomers(topCustRes.data);
      } catch (err: any) {
        console.error("Failed to load dashboard data:", err);
        setError(err.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="dashboard loading-state">
        <div className="loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error-state">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: "👥", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)" },
    { title: "Shipments Today", value: stats?.shipmentsToday?.toLocaleString() || "0", icon: "📦", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" },
    { title: "Shipments (Month)", value: stats?.shipmentsThisMonth?.toLocaleString() || "0", icon: "📊", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" },
    { title: "Revenue (Month)", value: formatCurrency(stats?.revenueThisMonth || 0), icon: "💰", color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)" },
    { title: "Commission Earned", value: formatCurrency(stats?.totalCommission || 0), icon: "🏦", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)" },
    { title: "Outstanding Credit", value: formatCurrency(stats?.totalOutstandingCredit || 0), icon: "⚠️", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" },
    { title: "Total Wallet Balance", value: formatCurrency(stats?.totalWalletBalance || 0), icon: "💳", color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)" },
    { title: "Total Vendors", value: stats?.totalVendors?.toLocaleString() || "0", icon: "🏪", color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)" },
  ];

  return (
    <div className="dashboard">
      {/* Section 1: KPI Cards */}
      <section className="stats-grid stats-grid-8">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card stat-card-enhanced" style={{ borderTop: `3px solid ${stat.color}` }}>
            <div className="stat-icon-enhanced" style={{ background: stat.gradient }}>{stat.icon}</div>
            <div className="stat-info">
              <h3 className="stat-title">{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Section 2: Charts Row 1 — Courier Pie + Top Customers Bar */}
      <section className="charts-grid">
        <div className="chart-card">
          <h3>🚚 Shipments by Courier</h3>
          <div className="chart-container">
            {courierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courierData}
                    dataKey="count"
                    nameKey="courier"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ courier, percent }: any) => `${courier} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {courierData.map((_entry, index) => (
                      <Cell key={index} fill={COURIER_COLORS[index % COURIER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value} shipments (₹${props.payload.revenue?.toLocaleString()})`,
                      props.payload.courier,
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No courier data available</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3>🏆 Top 5 Customers by Revenue</h3>
          <div className="chart-container">
            {topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No customer data available</div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Charts Row 2 — Orders Growth + Revenue */}
      <section className="charts-grid">
        <div className="chart-card">
          <h3>📈 Orders Growth (6 Months)</h3>
          <div className="chart-container">
            {ordersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No order data available</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3>💹 Revenue Trend (6 Months)</h3>
          <div className="chart-container">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No revenue data available</div>
            )}
          </div>
        </div>
      </section>

      {/* Section 4: Recent Activity Table */}
      <section className="recent-activity-card">
        <h3>📋 Recent Activity</h3>
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length > 0 ? (
                recentActivity.map((order, index) => (
                  <tr key={index}>
                    <td className="fw-medium">{order.id}</td>
                    <td>{order.user}</td>
                    <td>{order.vendor}</td>
                    <td>{order.amount}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data-cell">No recent orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
