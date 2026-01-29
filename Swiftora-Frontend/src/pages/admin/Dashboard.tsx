import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminApi } from "../../lib/api";
import "./Dashboard.css";

interface Stats {
  totalUsers: number;
  activeVendors: number;
  totalOrders: number;
  totalRevenue: number;
}

interface ChartData {
  name: string;
  orders?: number;
  revenue?: number;
}

interface RecentOrder {
  id: string;
  user: string;
  vendor: string;
  amount: string;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersData, setOrdersData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [statsRes, ordersChartRes, revenueChartRes, recentOrdersRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getOrdersChart(),
          adminApi.getRevenueChart(),
          adminApi.getRecentOrders(),
        ]);

        setStats(statsRes.data);
        setOrdersData(ordersChartRes.data);
        setRevenueData(revenueChartRes.data);
        setRecentActivity(recentOrdersRes.data);
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
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
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
    { title: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: "👥", color: "#4f46e5" },
    { title: "Active Vendors", value: stats?.activeVendors?.toLocaleString() || "0", icon: "🏪", color: "#10b981" },
    { title: "Total Orders", value: stats?.totalOrders?.toLocaleString() || "0", icon: "📦", color: "#f59e0b" },
    { title: "Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: "💰", color: "#ef4444" },
  ];

  return (
    <div className="dashboard">
      {/* Section 1: Stats Cards */}
      <section className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
            <div className="stat-info">
              <h3 className="stat-title">{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>{stat.icon}</div>
          </div>
        ))}
      </section>

      {/* Section 2: Charts */}
      <section className="charts-grid">
        <div className="chart-card">
          <h3>📈 Orders Growth</h3>
          <div className="chart-container">
            {ordersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#4f46e5" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No order data available</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3>📊 Revenue</h3>
          <div className="chart-container">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No revenue data available</div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Recent Activity Table */}
      <section className="recent-activity-card">
        <h3>Recent Activity</h3>
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
                      <span
                        className={`status-badge ${order.status.toLowerCase()}`}
                      >
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
