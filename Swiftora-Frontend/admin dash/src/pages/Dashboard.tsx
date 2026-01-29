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
import "./Dashboard.css";

const stats = [
  { title: "Total Users", value: "1,245", icon: "👥" },
  { title: "Active Vendors", value: "320", icon: "🏪" },
  { title: "Total Orders", value: "8,430", icon: "📦" },
  { title: "Revenue", value: "₹12,45,000", icon: "💰" },
];

const ordersData = [
  { name: "Jan", orders: 400 },
  { name: "Feb", orders: 600 },
  { name: "Mar", orders: 550 },
  { name: "Apr", orders: 800 },
  { name: "May", orders: 1100 },
  { name: "Jun", orders: 1300 },
];

const revenueData = [
  { name: "Jan", revenue: 24000 },
  { name: "Feb", revenue: 13980 },
  { name: "Mar", revenue: 98000 },
  { name: "Apr", revenue: 39080 },
  { name: "May", revenue: 48000 },
  { name: "Jun", revenue: 38000 },
];

const recentActivity = [
  {
    id: "#ORD-001",
    user: "John Doe",
    vendor: "Tech Store",
    amount: "₹12,000",
    status: "Completed",
  },
  {
    id: "#ORD-002",
    user: "Jane Smith",
    vendor: "Fashion Hub",
    amount: "₹4,500",
    status: "Pending",
  },
  {
    id: "#ORD-003",
    user: "Mike Johnson",
    vendor: "Gadget World",
    amount: "₹28,000",
    status: "Completed",
  },
  {
    id: "#ORD-004",
    user: "Sarah Wilson",
    vendor: "Home Decor",
    amount: "₹3,200",
    status: "Pending",
  },
  {
    id: "#ORD-005",
    user: "Tom Brown",
    vendor: "Sports Gear",
    amount: "₹8,900",
    status: "Completed",
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Section 1: Stats Cards */}
      <section className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-info">
              <h3 className="stat-title">{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
            <div className="stat-icon">{stat.icon}</div>
          </div>
        ))}
      </section>

      {/* Section 2: Charts */}
      <section className="charts-grid">
        <div className="chart-card">
          <h3>📈 Orders Growth</h3>
          <div className="chart-container">
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
          </div>
        </div>
        <div className="chart-card">
          <h3>📊 Revenue</h3>
          <div className="chart-container">
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
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
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
              {recentActivity.map((order, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
