import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/api";
import "./Pages.css";

interface VendorAnalytics {
  merchant: {
    id: string; companyName: string; email: string; phone: string;
    customerType: string; walletBalance: number; creditLimit: number;
    isPaused: boolean; createdAt: string;
    address?: string; city?: string; state?: string; pincode?: string;
    orderIdPrefix?: string;
  };
  financial: {
    walletBalance: number; creditLimit: number; usedCredit: number;
    outstandingAmount: number; totalRevenue: number; totalCommission: number;
    healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  };
  shipments: {
    totalOrders: number; ordersThisMonth: number; topCourier: string | null;
    totalShippingValue: number; avgShippingCost: number;
    delivered: number; cancelled: number; pending: number;
    inTransit: number; pickedUp: number; outForDelivery: number;
    courierBreakdown: { courier: string; count: number }[];
  };
  transactions: {
    id: string; date: string; type: string; status: string;
    amount: number; balanceAfter: number; description: string; reference: string;
  }[];
  warehouses: {
    id: string; name: string; address: string; city: string;
    state: string; pincode: string; phone: string; contactPerson: string;
    isDefault: boolean;
  }[];
  recentOrders: {
    id: string; orderNumber: string; awbNumber: string | null;
    status: string; courierName: string | null;
    customerName: string; deliveryPincode: string;
    date: string;
  }[];
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await adminApi.getVendorAnalytics(id);
        setAnalytics(res.data);
      } catch (err) {
        setError("Failed to load vendor analytics");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString()}`;

  const getHealthBadge = (status: string) => {
    switch (status) {
      case "HEALTHY": return <span className="health-badge health-green">🟢 Healthy</span>;
      case "WARNING": return <span className="health-badge health-yellow">🟡 Near Limit</span>;
      case "CRITICAL": return <span className="health-badge health-red">🔴 Critical</span>;
      default: return null;
    }
  };

  const getTxnColor = (type: string) => {
    switch (type) {
      case "RECHARGE": case "QR_CREDIT": return "#10b981";
      case "DEBIT": return "#ef4444";
      case "REFUND": case "COD_REMITTANCE": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  if (isLoading) {
    return <div className="page-container"><div className="loading-state">Loading vendor details...</div></div>;
  }

  if (error || !analytics) {
    return (
      <div className="page-container">
        <div className="loading-state" style={{ color: "#ef4444" }}>{error || "Vendor not found"}</div>
        <button className="action-btn" style={{ marginTop: 12 }} onClick={() => navigate("/admin/vendors")}>← Back to Vendors</button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <button
            onClick={() => navigate("/admin/vendors")}
            style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 8, display: "block" }}
          >
            ← Back to Vendors
          </button>
          <h2 style={{ margin: 0 }}>{analytics.merchant.companyName}</h2>
          <p className="text-muted" style={{ margin: "4px 0 0" }}>
            {analytics.merchant.email} · {analytics.merchant.phone} · Member since {new Date(analytics.merchant.createdAt).toLocaleDateString()}
          </p>
        </div>
        {getHealthBadge(analytics.financial.healthStatus)}
      </div>

      {/* Section A: Financial Overview */}
      <div className="panel-section" style={{ marginBottom: 24 }}>
        <h4>💰 Financial Overview</h4>
        <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          <div className="metric-card">
            <span className="metric-label">Account Type</span>
            <span className={`metric-value type-badge ${analytics.merchant.customerType === 'CREDIT' ? 'credit' : 'cash'}`}>
              {analytics.merchant.customerType || 'CASH'}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Wallet Balance</span>
            <span className="metric-value">{formatCurrency(analytics.financial.walletBalance)}</span>
          </div>
          {analytics.merchant.customerType === 'CREDIT' && (
            <>
              <div className="metric-card">
                <span className="metric-label">Credit Limit</span>
                <span className="metric-value">{formatCurrency(analytics.financial.creditLimit)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Used Credit</span>
                <span className="metric-value" style={{ color: "#f59e0b" }}>{formatCurrency(analytics.financial.usedCredit)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Outstanding</span>
                <span className="metric-value" style={{ color: analytics.financial.outstandingAmount > 0 ? "#ef4444" : "#10b981" }}>
                  {formatCurrency(analytics.financial.outstandingAmount)}
                </span>
              </div>
            </>
          )}
          <div className="metric-card">
            <span className="metric-label">Lifetime Revenue</span>
            <span className="metric-value" style={{ color: "#6366f1" }}>{formatCurrency(analytics.financial.totalRevenue)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Commission Earned</span>
            <span className="metric-value" style={{ color: "#10b981" }}>{formatCurrency(analytics.financial.totalCommission)}</span>
          </div>
        </div>
      </div>

      {/* Section B: Shipment Analytics */}
      <div className="panel-section" style={{ marginBottom: 24 }}>
        <h4>📦 Shipment Analytics</h4>
        <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
          <div className="metric-card">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{analytics.shipments.totalOrders}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Orders This Month</span>
            <span className="metric-value">{analytics.shipments.ordersThisMonth}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Avg. Shipping Cost</span>
            <span className="metric-value">{formatCurrency(analytics.shipments.avgShippingCost)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Top Courier</span>
            <span className="metric-value text-sm">{analytics.shipments.topCourier || '—'}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">✅ Delivered</span>
            <span className="metric-value" style={{ color: "#10b981" }}>{analytics.shipments.delivered}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">❌ Cancelled</span>
            <span className="metric-value" style={{ color: "#ef4444" }}>{analytics.shipments.cancelled}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">⏳ Pending</span>
            <span className="metric-value" style={{ color: "#f59e0b" }}>{analytics.shipments.pending}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">🚛 In Transit</span>
            <span className="metric-value" style={{ color: "#3b82f6" }}>{analytics.shipments.inTransit}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">📦 Picked Up</span>
            <span className="metric-value" style={{ color: "#8b5cf6" }}>{analytics.shipments.pickedUp}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">🚚 Out for Delivery</span>
            <span className="metric-value" style={{ color: "#0ea5e9" }}>{analytics.shipments.outForDelivery}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Total Shipping Value</span>
            <span className="metric-value">{formatCurrency(analytics.shipments.totalShippingValue)}</span>
          </div>
        </div>

        {/* Courier breakdown */}
        {analytics.shipments.courierBreakdown.length > 0 && (
          <div className="courier-breakdown" style={{ marginTop: 16 }}>
            <h5>Courier Usage</h5>
            <div className="courier-bars">
              {analytics.shipments.courierBreakdown.map((c, i) => {
                const max = analytics.shipments.courierBreakdown[0]?.count || 1;
                return (
                  <div key={i} className="courier-bar-row">
                    <span className="courier-name">{c.courier || 'Unknown'}</span>
                    <div className="courier-bar-track">
                      <div className="courier-bar-fill" style={{ width: `${(c.count / max) * 100}%`, background: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }} />
                    </div>
                    <span className="courier-count">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section C: Address & Warehouses */}
      <div className="panel-section" style={{ marginBottom: 24 }}>
        <h4>📍 Address & Warehouses</h4>
        {analytics.merchant.address && (
          <div className="metric-card" style={{ marginBottom: '12px' }}>
            <span className="metric-label">Business Address</span>
            <span className="metric-value text-sm">
              {analytics.merchant.address}, {analytics.merchant.city}, {analytics.merchant.state} - {analytics.merchant.pincode}
            </span>
          </div>
        )}
        {analytics.merchant.orderIdPrefix && (
          <div className="metric-card" style={{ marginBottom: '12px' }}>
            <span className="metric-label">Order ID Prefix</span>
            <span className="metric-value text-sm">{analytics.merchant.orderIdPrefix}</span>
          </div>
        )}
        {analytics.warehouses && analytics.warehouses.length > 0 ? (
          <div className="txn-table-container">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>Pincode</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {analytics.warehouses.map((w) => (
                  <tr key={w.id}>
                    <td className="fw-medium">{w.name} {w.isDefault ? '⭐' : ''}</td>
                    <td>{w.address}</td>
                    <td>{w.city}, {w.state}</td>
                    <td>{w.pincode}</td>
                    <td>{w.contactPerson || '—'}<br/><span className="text-muted text-xs">{w.phone}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '13px' }}>No warehouses configured</p>
        )}
      </div>

      {/* Section D: Transaction History */}
      <div className="panel-section" style={{ marginBottom: 24 }}>
        <h4>💳 Transaction History</h4>
        <div className="txn-table-container">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {analytics.transactions.length > 0 ? (
                analytics.transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <span className="txn-type-badge" style={{ color: getTxnColor(t.type), background: `${getTxnColor(t.type)}15` }}>
                        {t.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: t.amount >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                      {t.type === 'DEBIT' ? '-' : '+'}₹{Math.abs(t.amount).toLocaleString()}
                    </td>
                    <td>{formatCurrency(t.balanceAfter)}</td>
                    <td className="text-muted text-xs">{t.reference || t.description || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="no-data-cell">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section E: Recent Orders with AWB */}
      <div className="panel-section" style={{ marginBottom: 24 }}>
        <h4>📋 Recent Orders</h4>
        <div className="txn-table-container">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>AWB</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
                analytics.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="fw-medium">{o.orderNumber || o.id.slice(0, 8)}</td>
                    <td>{o.awbNumber || '—'}</td>
                    <td>{o.customerName || '—'}</td>
                    <td>{o.courierName || '—'}</td>
                    <td>
                      <span className="txn-type-badge" style={{
                        color: o.status === 'DELIVERED' ? '#10b981' : o.status === 'CANCELLED' ? '#ef4444' : '#f59e0b',
                        background: o.status === 'DELIVERED' ? '#10b98115' : o.status === 'CANCELLED' ? '#ef444415' : '#f59e0b15',
                      }}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-muted text-xs">{new Date(o.date).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="no-data-cell">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
