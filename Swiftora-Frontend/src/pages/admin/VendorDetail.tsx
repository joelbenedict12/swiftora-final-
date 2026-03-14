import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
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

  // Pricing configuration state
  const [marginType, setMarginType] = useState("percentage");
  const [marginValue, setMarginValue] = useState("");
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState("");

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

  useEffect(() => {
    if (!id) return;
    setPricingLoading(true);
    adminApi.getVendorPricing(id)
      .then((res) => {
        setMarginType(res.data.pricing.marginType || "percentage");
        setMarginValue(String(res.data.pricing.marginValue || "0"));
      })
      .catch(() => {})
      .finally(() => setPricingLoading(false));
  }, [id]);

  const handleSavePricing = async () => {
    if (!id) return;
    setPricingSaving(true);
    setPricingMessage("");
    try {
      const numValue = Number(marginValue);
      if (isNaN(numValue) || numValue < 0) {
        setPricingMessage("Margin value must be >= 0");
        return;
      }
      if (marginType === "percentage" && numValue > 100) {
        setPricingMessage("Percentage must be between 0 and 100");
        return;
      }
      await adminApi.updateVendorPricing(id, { marginType, marginValue: numValue });
      setPricingMessage("Pricing saved successfully!");
    } catch (err: any) {
      setPricingMessage(err.response?.data?.error || "Failed to save pricing");
    } finally {
      setPricingSaving(false);
    }
  };

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

  const getMarginPreview = () => {
    const sampleCost = 100;
    const val = Number(marginValue) || 0;
    const margin = marginType === "percentage" ? sampleCost * val / 100 : val;
    return { sampleCost, margin, final: sampleCost + margin };
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

  const preview = getMarginPreview();

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

      <Tabs defaultValue="general" style={{ width: "100%" }}>
        <TabsList style={{ marginBottom: 20, display: "flex", gap: 4, width: "100%", justifyContent: "flex-start" }}>
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Configuration</TabsTrigger>
          <TabsTrigger value="credit">Credit Settings</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* ===== General Info Tab ===== */}
        <TabsContent value="general">
          {/* Financial Overview */}
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Financial Overview</h4>
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

          {/* Shipment Analytics */}
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Shipment Analytics</h4>
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
                <span className="metric-label">Delivered</span>
                <span className="metric-value" style={{ color: "#10b981" }}>{analytics.shipments.delivered}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Cancelled</span>
                <span className="metric-value" style={{ color: "#ef4444" }}>{analytics.shipments.cancelled}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Pending</span>
                <span className="metric-value" style={{ color: "#f59e0b" }}>{analytics.shipments.pending}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">In Transit</span>
                <span className="metric-value" style={{ color: "#3b82f6" }}>{analytics.shipments.inTransit}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Picked Up</span>
                <span className="metric-value" style={{ color: "#8b5cf6" }}>{analytics.shipments.pickedUp}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Out for Delivery</span>
                <span className="metric-value" style={{ color: "#0ea5e9" }}>{analytics.shipments.outForDelivery}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Total Shipping Value</span>
                <span className="metric-value">{formatCurrency(analytics.shipments.totalShippingValue)}</span>
              </div>
            </div>

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

          {/* Address & Warehouses */}
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Address & Warehouses</h4>
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
        </TabsContent>

        {/* ===== Pricing Configuration Tab ===== */}
        <TabsContent value="pricing">
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Customer Margin Configuration</h4>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Configure a custom margin for this customer. If not set (value = 0), the global platform commission will apply.
            </p>

            {pricingLoading ? (
              <div className="loading-state">Loading pricing...</div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Margin Type</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setMarginType("percentage")}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 6,
                        border: marginType === "percentage" ? "2px solid #6366f1" : "1px solid #e2e8f0",
                        background: marginType === "percentage" ? "#eef2ff" : "#fff",
                        color: marginType === "percentage" ? "#6366f1" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Percentage (%)
                    </button>
                    <button
                      onClick={() => setMarginType("fixed")}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 6,
                        border: marginType === "fixed" ? "2px solid #6366f1" : "1px solid #e2e8f0",
                        background: marginType === "fixed" ? "#eef2ff" : "#fff",
                        color: marginType === "fixed" ? "#6366f1" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Fixed Amount (₹)
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>
                    Margin Value {marginType === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={marginValue}
                    onChange={(e) => setMarginValue(e.target.value)}
                    min="0"
                    max={marginType === "percentage" ? "100" : undefined}
                    step={marginType === "percentage" ? "0.5" : "1"}
                    style={{ maxWidth: 240 }}
                  />
                  <small style={{ color: "#666", display: "block", marginTop: 4 }}>
                    {marginType === "percentage"
                      ? "Enter percentage (0–100). Applied as % of courier cost."
                      : "Enter fixed amount in ₹. Added to courier cost per shipment."}
                  </small>
                </div>

                {/* Live preview */}
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20,
                  maxWidth: 360,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 10 }}>
                    Preview (Sample Courier Cost: ₹{preview.sampleCost})
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Courier Cost</span>
                    <span>₹{preview.sampleCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Customer Margin</span>
                    <span style={{ color: "#6366f1" }}>₹{preview.margin.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 6, marginTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
                    <span>Final Price</span>
                    <span style={{ color: "#059669" }}>₹{preview.final.toFixed(2)}</span>
                  </div>
                </div>

                {pricingMessage && (
                  <div style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    marginBottom: 12,
                    background: pricingMessage.includes("success") ? "#d4edda" : "#f8d7da",
                    color: pricingMessage.includes("success") ? "#155724" : "#721c24",
                    fontSize: 13,
                  }}>
                    {pricingMessage}
                  </div>
                )}

                <button
                  onClick={handleSavePricing}
                  disabled={pricingSaving}
                  style={{
                    padding: "10px 28px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    background: pricingSaving ? "#94a3b8" : "#6366f1",
                    border: "none",
                    borderRadius: 8,
                    cursor: pricingSaving ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
                    transition: "all 0.2s",
                  }}
                >
                  {pricingSaving ? "Saving..." : "Save Pricing"}
                </button>
              </>
            )}
          </div>
        </TabsContent>

        {/* ===== Credit Settings Tab ===== */}
        <TabsContent value="credit">
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Credit Settings</h4>
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
            </div>
            {analytics.merchant.customerType !== 'CREDIT' && (
              <p className="text-muted" style={{ fontSize: 13, marginTop: 12 }}>
                This customer is on Cash & Carry billing. Switch to CREDIT from the Vendors list to enable credit settings.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ===== Orders Tab ===== */}
        <TabsContent value="orders">
          {/* Transaction History */}
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Transaction History</h4>
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

          {/* Recent Orders */}
          <div className="panel-section" style={{ marginBottom: 24 }}>
            <h4>Recent Orders</h4>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
