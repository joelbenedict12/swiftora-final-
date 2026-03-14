import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { adminApi, ordersApi } from "../../lib/api";
import "./Dashboard.css";

interface ProfitSummary {
    totalRevenue: number;
    totalCourierCost: number;
    totalProfit: number;
    totalOrders: number;
    totalCommission: number;
    averageMarginPercent: number;
}

interface CourierProfit {
    courierName: string;
    totalRevenue: number;
    totalCourierCost: number;
    totalProfit: number;
    orderCount: number;
    marginPercent: number;
}

interface OrderCountByCourier {
    courierName: string;
    count: number;
    percent: number;
}

interface VendorProfit {
    merchantId: string;
    companyName: string;
    totalOrders: number;
    totalRevenue: number;
    totalVendorRevenue: number;
    totalCourierCost: number;
    totalProfit: number;
    marginPercent: number;
}

const COURIER_COLORS: Record<string, string> = {
    DELHIVERY: "#3b82f6",
    XPRESSBEES: "#22c55e",
    EKART: "#a855f7",
    BLITZ: "#f97316",
    INNOFULFILL: "#14b8a6",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#14b8a6", "#ef4444", "#eab308"];

export default function Analytics() {
    const [summary, setSummary] = useState<ProfitSummary | null>(null);
    const [byCourier, setByCourier] = useState<CourierProfit[]>([]);
    const [orderCountByCourier, setOrderCountByCourier] = useState<OrderCountByCourier[]>([]);
    const [byVendor, setByVendor] = useState<VendorProfit[]>([]);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commissionPercent, setCommissionPercent] = useState<number>(15);

    const loadAnalytics = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params: Record<string, string> = {};
            if (dateRange.from) params.from = dateRange.from;
            if (dateRange.to) params.to = dateRange.to;

            const res = await adminApi.getAnalytics(params);
            const data = res.data;
            setSummary(data.summary || null);
            setByCourier(data.byCourier || []);
            setOrderCountByCourier(data.orderCountByCourier || []);
            setByVendor(data.byVendor || []);

            // Fetch commission %
            try {
                const cRes = await ordersApi.getPlatformCommission();
                setCommissionPercent(cRes.data?.commission ?? 15);
            } catch { /* keep default */ }
        } catch (err: any) {
            console.error("Failed to load analytics:", err);
            setError(err.response?.data?.error || "Failed to load analytics");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
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
                <div className="loading-spinner">Loading analytics...</div>
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
        {
            title: "Total Revenue",
            value: formatCurrency(summary?.totalRevenue ?? 0),
            icon: "📈",
            color: "#4f46e5",
        },
        {
            title: "Courier Cost",
            value: formatCurrency(summary?.totalCourierCost ?? 0),
            icon: "🚚",
            color: "#f59e0b",
        },
        {
            title: "Net Profit",
            value: formatCurrency(summary?.totalProfit ?? 0),
            icon: "💰",
            color: "#10b981",
        },
        {
            title: "Avg Margin %",
            value: `${(summary?.averageMarginPercent ?? 0).toFixed(1)}%`,
            icon: "📊",
            color: "#ef4444",
        },
        {
            title: "Platform Commission",
            value: `${commissionPercent}% · ${formatCurrency(summary?.totalCommission ?? 0)}`,
            icon: "⚙️",
            color: "#8b5cf6",
        },
    ];

    const courierChartData = byCourier.map((c) => ({
        name: c.courierName,
        profit: c.totalProfit,
        cost: c.totalCourierCost,
        revenue: c.totalRevenue,
        orders: c.orderCount,
    }));

    const pieData = orderCountByCourier.length > 0
        ? orderCountByCourier.map((r) => ({ name: r.courierName, count: r.count, percent: r.percent }))
        : byCourier.map((c) => ({ name: c.courierName, count: c.orderCount, percent: summary?.totalOrders ? (c.orderCount / summary.totalOrders) * 100 : 0 }));

    return (
        <div className="dashboard">
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    📈 Profit & Loss Analytics
                </h2>
                <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
                    Track margins, courier costs, and vendor revenue
                </p>
            </div>

            {/* Date Filter */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 24,
                    flexWrap: "wrap",
                }}
            >
                <label style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>From:</label>
                <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        color: "#0f172a",
                    }}
                />
                <label style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>To:</label>
                <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        color: "#0f172a",
                    }}
                />
                <button
                    onClick={loadAnalytics}
                    style={{
                        padding: "6px 18px",
                        borderRadius: 6,
                        border: "none",
                        background: "#4f46e5",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                    }}
                >
                    Apply
                </button>
            </div>

            {/* Stat Cards */}
            <section className="stats-grid">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
                        <div className="stat-info">
                            <h3 className="stat-title">{stat.title}</h3>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </section>

            {/* Charts */}
            <section className="charts-grid">
                {/* Profit by Courier Bar Chart */}
                <div className="chart-card">
                    <h3>🚚 Profit by Courier</h3>
                    <div className="chart-container">
                        {courierChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={courierChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#6b7280", fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#6b7280" }}
                                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 8,
                                            border: "none",
                                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                                        }}
                                        formatter={(value: number, name: string) => [
                                            typeof value === "number" && name === "revenue" ? `₹${value.toLocaleString()}` : `₹${Number(value).toLocaleString()}`,
                                            name === "profit" ? "Profit" : name === "cost" ? "Courier Cost" : "Revenue",
                                        ]}
                                    />
                                    <Bar dataKey="revenue" fill="#4f46e5" name="revenue" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="cost" fill="#f59e0b" name="cost" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="profit" fill="#10b981" name="profit" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Legend
                                        formatter={(val) =>
                                            val === "revenue" ? "Revenue" : val === "cost" ? "Courier Cost" : "Profit"
                                        }
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No courier data available</div>
                        )}
                    </div>
                </div>

                {/* Order Volume Pie Chart */}
                <div className="chart-card">
                    <h3>📦 Orders by Courier</h3>
                    <div className="chart-container">
                        {courierChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={courierChartData}
                                        dataKey="orders"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, orders }) => `${name}: ${orders}`}
                                    >
                                        {courierChartData.map((entry, i) => (
                                            <Cell
                                                key={`cell-${i}`}
                                                fill={COURIER_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`${value} orders`, "Orders"]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No data available</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Vendor Profit Table */}
            <section className="recent-activity-card">
                <h3>🏪 Profit by Vendor</h3>
                <div className="table-responsive">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Orders</th>
                                <th>Courier Cost</th>
                                <th>Vendor Charge</th>
                                <th>Profit</th>
                                <th>Margin %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {byVendor.length > 0 ? (
                                byVendor.map((vendor, i) => {
                                    const vendorRev = Number(vendor.totalVendorRevenue || vendor.totalRevenue || 0);
                                    const margin =
                                        vendorRev > 0
                                            ? ((Number(vendor.totalProfit || 0) / vendorRev) * 100).toFixed(1)
                                            : "0.0";
                                    return (
                                        <tr key={i}>
                                            <td className="fw-medium">{vendor.companyName || vendor.merchantId}</td>
                                            <td>{vendor.totalOrders}</td>
                                            <td>₹{Number(vendor.totalCourierCost || 0).toLocaleString()}</td>
                                            <td>₹{vendorRev.toLocaleString()}</td>
                                            <td style={{ color: Number(vendor.totalProfit || 0) >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                                ₹{Number(vendor.totalProfit || 0).toLocaleString()}
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${Number(margin) >= 10 ? "completed" : "pending"}`}
                                                >
                                                    {margin}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="no-data-cell">
                                        No vendor data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
