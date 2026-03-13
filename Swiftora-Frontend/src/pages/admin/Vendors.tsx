import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import "./Pages.css";

interface Vendor {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  walletBalance: number;
  isPaused: boolean;
  customerType: "CASH" | "CREDIT";
  creditLimit: number;
  orderCount: number;
  userCount: number;
  warehouseCount: number;
  createdAt: string;
}

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
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Customer type edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"CASH" | "CREDIT">("CASH");
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [savingType, setSavingType] = useState(false);

  // Invoice generation state
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [invoiceMonth, setInvoiceMonth] = useState("");

  // Analytics panel state
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getVendors();
      setVendors(response.data);
      setFilteredVendors(response.data);
    } catch (error) {
      console.error("Failed to load vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadVendors(); }, []);

  useEffect(() => {
    if (searchTerm) {
      const result = vendors.filter(vendor =>
        vendor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVendors(result);
    } else {
      setFilteredVendors(vendors);
    }
  }, [vendors, searchTerm]);

  const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString()}`;

  const handleTogglePause = async (vendor: Vendor) => {
    const newPaused = !vendor.isPaused;
    const action = newPaused ? "pause" : "unpause";
    if (!confirm(`Are you sure you want to ${action} ${vendor.companyName || vendor.email}?`)) return;
    setTogglingId(vendor.id);
    try {
      await adminApi.toggleVendorPause(vendor.id, newPaused);
      setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isPaused: newPaused } : v));
    } catch (err) {
      console.error("Failed to toggle pause:", err);
      alert("Failed to update vendor status");
    } finally {
      setTogglingId(null);
    }
  };

  const startEditType = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditType(vendor.customerType || "CASH");
    setEditCreditLimit(String(Number(vendor.creditLimit || 0)));
  };

  const cancelEditType = () => { setEditingId(null); setEditType("CASH"); setEditCreditLimit(""); };

  const saveCustomerType = async (vendorId: string) => {
    setSavingType(true);
    try {
      await adminApi.updateCustomerType(vendorId, {
        customerType: editType,
        creditLimit: editType === "CREDIT" ? Number(editCreditLimit) : 0,
      });
      setVendors(prev =>
        prev.map(v =>
          v.id === vendorId ? { ...v, customerType: editType, creditLimit: editType === "CREDIT" ? Number(editCreditLimit) : 0 } : v
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update customer type:", err);
      alert("Failed to update customer type");
    } finally {
      setSavingType(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!confirm("Generate monthly invoices for all CREDIT vendors? This will bill the previous month's shipments.")) return;
    setGeneratingInvoices(true);
    try {
      const res = await adminApi.generateMonthlyInvoices(invoiceMonth || undefined);
      const data = res.data;
      alert(`Invoices generated: ${data.generated?.length || 0}\nSkipped: ${data.skipped?.length || 0}\nErrors: ${data.errors?.length || 0}`);
    } catch (err: any) {
      console.error("Failed to generate invoices:", err);
      alert(err?.response?.data?.error || "Failed to generate invoices");
    } finally {
      setGeneratingInvoices(false);
    }
  };

  const openAnalytics = async (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setLoadingAnalytics(true);
    try {
      const res = await adminApi.getVendorAnalytics(vendorId);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load vendor analytics:", err);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const closeAnalytics = () => { setSelectedVendorId(null); setAnalytics(null); };

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
    return <div className="page-container"><div className="loading-state">Loading vendors...</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Vendors</h2>
        <span className="user-count">{filteredVendors.length} vendors</span>
      </div>

      <div className="filters-bar" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search vendors..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <input type="month" value={invoiceMonth} onChange={(e) => setInvoiceMonth(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }} placeholder="Month (optional)" />
          <button className="action-btn btn-view" style={{ padding: "6px 16px", fontSize: "13px", whiteSpace: "nowrap" }} onClick={handleGenerateInvoices} disabled={generatingInvoices}>
            {generatingInvoices ? "Generating..." : "Generate Invoices"}
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Wallet / Credit</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="fw-medium">{vendor.companyName || '-'}</td>
                  <td>{vendor.email || '-'}</td>
                  <td>
                    {editingId === vendor.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
                        <select value={editType} onChange={(e) => setEditType(e.target.value as "CASH" | "CREDIT")} style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}>
                          <option value="CASH">CASH</option><option value="CREDIT">CREDIT</option>
                        </select>
                        {editType === "CREDIT" && (
                          <input type="number" placeholder="Credit Limit" value={editCreditLimit} onChange={(e) => setEditCreditLimit(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px", width: "120px" }} />
                        )}
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button className="action-btn btn-view" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={() => saveCustomerType(vendor.id)} disabled={savingType}>{savingType ? "..." : "Save"}</button>
                          <button className="action-btn" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={cancelEditType}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <span className="status-badge" style={{ background: vendor.customerType === "CREDIT" ? "#dbeafe" : "#f3f4f6", color: vendor.customerType === "CREDIT" ? "#1e40af" : "#374151", cursor: "pointer" }} onClick={() => startEditType(vendor)} title="Click to change">
                        {vendor.customerType || "CASH"}
                      </span>
                    )}
                  </td>
                  <td className="wallet-balance">
                    {vendor.customerType === "CREDIT" ? `Limit: ${formatCurrency(vendor.creditLimit)}` : formatCurrency(vendor.walletBalance)}
                  </td>
                  <td>
                    {vendor.isPaused
                      ? <span className="status-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>Paused</span>
                      : <span className="status-badge" style={{ background: "#dcfce7", color: "#166534" }}>Active</span>}
                  </td>
                  <td>{vendor.orderCount}</td>
                  <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button className="action-btn btn-view" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => openAnalytics(vendor.id)}>
                      View
                    </button>
                    <button
                      className={`action-btn ${vendor.isPaused ? "btn-view" : "btn-delete"}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => handleTogglePause(vendor)}
                      disabled={togglingId === vendor.id}
                    >
                      {togglingId === vendor.id ? "..." : vendor.isPaused ? "Unpause" : "Pause"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data-cell">{searchTerm ? "No vendors match your search" : "No vendors found"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======== ANALYTICS SLIDE-OUT PANEL ======== */}
      {selectedVendorId && (
        <>
          <div className="panel-overlay" onClick={closeAnalytics} />
          <div className="analytics-panel">
            <div className="panel-header">
              <h2>📊 Vendor Analytics</h2>
              <button className="panel-close" onClick={closeAnalytics}>✕</button>
            </div>

            {loadingAnalytics ? (
              <div className="panel-loading">Loading analytics...</div>
            ) : analytics ? (
              <div className="panel-body">
                {/* Vendor Header */}
                <div className="panel-vendor-header">
                  <div>
                    <h3>{analytics.merchant.companyName}</h3>
                    <p className="text-muted">{analytics.merchant.email} · {analytics.merchant.phone}</p>
                    <p className="text-muted text-xs">Member since {new Date(analytics.merchant.createdAt).toLocaleDateString()}</p>
                  </div>
                  {getHealthBadge(analytics.financial.healthStatus)}
                </div>

                {/* Section A: Financial Overview */}
                <div className="panel-section">
                  <h4>💰 Financial Overview</h4>
                  <div className="metrics-grid">
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
                <div className="panel-section">
                  <h4>📦 Shipment Analytics</h4>
                  <div className="metrics-grid">
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

                  {/* Courier breakdown mini-table */}
                  {analytics.shipments.courierBreakdown.length > 0 && (
                    <div className="courier-breakdown">
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
                <div className="panel-section">
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
                <div className="panel-section">
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
              </div>
            ) : (
              <div className="panel-loading">Failed to load analytics data</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
