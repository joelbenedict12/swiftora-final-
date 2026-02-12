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
import { adminApi } from "../../lib/api";
import "./Dashboard.css";

interface ProfitSummary {
    totalCourierCost: number;
    totalVendorCharge: number;
    totalProfit: number;
    totalOrders: number;
    avgMarginPercent: number;
}

interface CourierProfit {
    courierName: string;
    totalCourierCost: number;
    totalVendorCharge: number;
    profit: number;
    orders: number;
}

interface VendorProfit {
    merchantId: string;
    merchantName: string;
    totalCourierCost: number;
    totalVendorCharge: number;
    profit: number;
    orders: number;
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
    const [byVendor, setByVendor] = useState<VendorProfit[]>([]);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            setByVendor(data.byVendor || []);
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
            title: "Total Profit",
            value: formatCurrency(summary?.totalProfit || 0),
            icon: "💰",
            color: "#10b981",
        },
        {
            title: "Vendor Charges",
            value: formatCurrency(summary?.totalVendorCharge || 0),
            icon: "🧾",
            color: "#4f46e5",
        },
        {
            title: "Courier Costs",
            value: formatCurrency(summary?.totalCourierCost || 0),
            icon: "🚚",
            color: "#f59e0b",
        },
        {
            title: "Avg Margin",
            value: `${(summary?.avgMarginPercent || 0).toFixed(1)}%`,
            icon: "📊",
            color: "#ef4444",
        },
    ];

    // Transform courier data for chart
    const courierChartData = byCourier.map((c) => ({
        name: c.courierName,
        profit: c.profit,
        cost: c.totalCourierCost,
        charge: c.totalVendorCharge,
        orders: c.orders,
    }));

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
                                            `₹${value.toLocaleString()}`,
                                            name === "profit"
                                                ? "Profit"
                                                : name === "cost"
                                                    ? "Courier Cost"
                                                    : "Vendor Charge",
                                        ]}
                                    />
                                    <Bar dataKey="charge" fill="#4f46e5" name="charge" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="cost" fill="#f59e0b" name="cost" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="profit" fill="#10b981" name="profit" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Legend
                                        formatter={(val) =>
                                            val === "charge" ? "Vendor Charge" : val === "cost" ? "Courier Cost" : "Profit"
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
                                    const margin =
                                        vendor.totalVendorCharge > 0
                                            ? ((vendor.profit / vendor.totalVendorCharge) * 100).toFixed(1)
                                            : "0.0";
                                    return (
                                        <tr key={i}>
                                            <td className="fw-medium">{vendor.merchantName || vendor.merchantId}</td>
                                            <td>{vendor.orders}</td>
                                            <td>₹{vendor.totalCourierCost.toLocaleString()}</td>
                                            <td>₹{vendor.totalVendorCharge.toLocaleString()}</td>
                                            <td style={{ color: vendor.profit >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                                ₹{vendor.profit.toLocaleString()}
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
