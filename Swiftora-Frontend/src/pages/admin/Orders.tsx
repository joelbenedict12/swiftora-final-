import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../lib/api";
import "./Pages.css";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  courierName: string | null;
  awbNumber: string | null;
  paymentMode: string;
  productName: string;
  productValue: number;
  weight: number;
  courierCost: number | null;
  vendorCharge: number | null;
  margin: number | null;
  additionalChargeTotal: number | null;
  finalPrice: number | null;
  merchantId: string;
  merchant?: { companyName: string; customerType: string };
  createdAt: string;
  shippedAt: string | null;
}

interface AdditionalCharge {
  id: string;
  chargeName: string;
  chargeType: string;
  chargeValue: number;
}

interface PriceBreakdown {
  courierCost: number;
  marginAmount: number;
  additionalCharges: { id: string; name: string; type: string; value: number }[];
  additionalChargeTotal: number;
  finalPrice: number;
  customerType: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [charges, setCharges] = useState<AdditionalCharge[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // Add charge form state
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeType, setNewChargeType] = useState("fixed");
  const [newChargeValue, setNewChargeValue] = useState("");
  const [chargeSaving, setChargeSaving] = useState(false);
  const [chargeMessage, setChargeMessage] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminApi.getAdminOrders(params);
      setOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const loadOrderDetail = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    setBreakdownLoading(true);
    setBreakdown(null);
    setCharges([]);
    setShowAddCharge(false);
    setChargeMessage("");
    try {
      const [breakdownRes, chargesRes] = await Promise.all([
        adminApi.getOrderPriceBreakdown(orderId),
        adminApi.getAdditionalCharges(orderId),
      ]);
      setBreakdown(breakdownRes.data.breakdown);
      setCharges(chargesRes.data.charges || []);
    } catch (err) {
      console.error("Failed to load order detail:", err);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleAddCharge = async () => {
    if (!expandedOrder) return;
    if (!newChargeName.trim()) { setChargeMessage("Charge name is required"); return; }
    const val = Number(newChargeValue);
    if (isNaN(val) || val < 0) { setChargeMessage("Charge value must be >= 0"); return; }
    setChargeSaving(true);
    setChargeMessage("");
    try {
      await adminApi.addAdditionalCharge(expandedOrder, {
        chargeName: newChargeName.trim(),
        chargeType: newChargeType,
        chargeValue: val,
      });
      setNewChargeName("");
      setNewChargeValue("");
      setNewChargeType("fixed");
      setShowAddCharge(false);
      // Reload breakdown + charges
      const [breakdownRes, chargesRes] = await Promise.all([
        adminApi.getOrderPriceBreakdown(expandedOrder),
        adminApi.getAdditionalCharges(expandedOrder),
      ]);
      setBreakdown(breakdownRes.data.breakdown);
      setCharges(chargesRes.data.charges || []);
      setChargeMessage("Charge added successfully!");
      loadOrders();
    } catch (err: any) {
      setChargeMessage(err.response?.data?.error || "Failed to add charge");
    } finally {
      setChargeSaving(false);
    }
  };

  const handleRemoveCharge = async (chargeId: string) => {
    if (!expandedOrder) return;
    try {
      await adminApi.removeAdditionalCharge(expandedOrder, chargeId);
      const [breakdownRes, chargesRes] = await Promise.all([
        adminApi.getOrderPriceBreakdown(expandedOrder),
        adminApi.getAdditionalCharges(expandedOrder),
      ]);
      setBreakdown(breakdownRes.data.breakdown);
      setCharges(chargesRes.data.charges || []);
      loadOrders();
    } catch (err: any) {
      setChargeMessage(err.response?.data?.error || "Failed to remove charge");
    }
  };

  const formatCurrency = (v: number | null | undefined) => `₹${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusColor = (status: string) => {
    if (["DELIVERED"].includes(status)) return "#10b981";
    if (["CANCELLED", "RTO", "FAILED"].includes(status)) return "#ef4444";
    if (["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(status)) return "#3b82f6";
    return "#f59e0b";
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Orders</h2>
        <span style={{ color: "#64748b", fontSize: 14 }}>{orders.length} orders</span>
      </div>

      <div className="filters-bar" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by order #, customer, AWB..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="READY_TO_SHIP">Ready to Ship</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RTO">RTO</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="loading-state" style={{ color: "#64748b" }}>No orders found</div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Vendor</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>Status</th>
                <th>Final Price</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => loadOrderDetail(order.id)}>
                    <td className="fw-medium">{order.orderNumber}</td>
                    <td>{order.merchant?.companyName || '—'}</td>
                    <td>{order.customerName}</td>
                    <td>{order.courierName || '—'}</td>
                    <td>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        color: getStatusColor(order.status),
                        background: `${getStatusColor(order.status)}15`,
                      }}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {order.finalPrice != null ? formatCurrency(order.finalPrice) : order.vendorCharge != null ? formatCurrency(order.vendorCharge) : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: "#64748b" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="action-btn btn-view"
                        onClick={(e) => { e.stopPropagation(); loadOrderDetail(order.id); }}
                      >
                        {expandedOrder === order.id ? "Close" : "Details"}
                      </button>
                    </td>
                  </tr>

                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={8} style={{ padding: 0, background: "#f8fafc" }}>
                        <div style={{ padding: 20 }}>
                          {breakdownLoading ? (
                            <div style={{ color: "#64748b", fontSize: 13 }}>Loading details...</div>
                          ) : (
                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                              {/* Price Breakdown */}
                              <div style={{ flex: "1 1 320px", minWidth: 280 }}>
                                <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Shipping Cost Breakdown</h4>

                                {breakdown && breakdown.customerType === "CREDIT" && order.merchant?.customerType === "CREDIT" ? (
                                  <>
                                    <div style={{
                                      background: "#fff7ed",
                                      border: "1px solid #fed7aa",
                                      borderRadius: 8,
                                      padding: 14,
                                      marginBottom: 12,
                                      fontSize: 13,
                                      color: "#9a3412",
                                    }}>
                                      Pricing will be reflected in the monthly invoice.
                                    </div>
                                    {/* Admin still sees breakdown below the notice */}
                                    <div style={{ opacity: 0.7, fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                                      Admin view (hidden from vendor):
                                    </div>
                                  </>
                                ) : null}

                                {breakdown ? (
                                  <div style={{
                                    background: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    padding: 16,
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                                      <span style={{ color: "#64748b" }}>Courier Cost</span>
                                      <span>{formatCurrency(breakdown.courierCost)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                                      <span style={{ color: "#64748b" }}>Customer Margin</span>
                                      <span style={{ color: "#6366f1" }}>{formatCurrency(breakdown.marginAmount)}</span>
                                    </div>
                                    {breakdown.additionalCharges.map((c) => (
                                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                                        <span style={{ color: "#64748b" }}>{c.name} ({c.type === "percentage" ? `${c.value}%` : `₹${c.value}`})</span>
                                        <span>{formatCurrency(c.type === "percentage" ? breakdown.courierCost * c.value / 100 : c.value)}</span>
                                      </div>
                                    ))}
                                    <div style={{
                                      borderTop: "2px solid #e2e8f0",
                                      paddingTop: 8,
                                      marginTop: 8,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontWeight: 700,
                                      fontSize: 15,
                                    }}>
                                      <span>Final Price</span>
                                      <span style={{ color: "#059669" }}>{formatCurrency(breakdown.finalPrice)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ color: "#94a3b8", fontSize: 13 }}>No pricing data available</div>
                                )}
                              </div>

                              {/* Additional Charges Management */}
                              <div style={{ flex: "1 1 380px", minWidth: 300 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Additional Charges</h4>
                                  <button
                                    onClick={() => setShowAddCharge(!showAddCharge)}
                                    style={{
                                      padding: "6px 14px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: "#fff",
                                      background: "#6366f1",
                                      border: "none",
                                      borderRadius: 6,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {showAddCharge ? "Cancel" : "+ Add Charge"}
                                  </button>
                                </div>

                                {showAddCharge && (
                                  <div style={{
                                    background: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    padding: 14,
                                    marginBottom: 12,
                                  }}>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                                      <div style={{ flex: "1 1 140px" }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Charge Name</label>
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="e.g. QC Charge"
                                          value={newChargeName}
                                          onChange={(e) => setNewChargeName(e.target.value)}
                                          style={{ fontSize: 13 }}
                                        />
                                      </div>
                                      <div style={{ flex: "0 0 130px" }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Type</label>
                                        <select
                                          className="filter-select"
                                          value={newChargeType}
                                          onChange={(e) => setNewChargeType(e.target.value)}
                                          style={{ fontSize: 13, width: "100%" }}
                                        >
                                          <option value="fixed">Fixed (₹)</option>
                                          <option value="percentage">Percentage (%)</option>
                                        </select>
                                      </div>
                                      <div style={{ flex: "0 0 100px" }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Value</label>
                                        <input
                                          type="number"
                                          className="form-input"
                                          placeholder="0"
                                          value={newChargeValue}
                                          onChange={(e) => setNewChargeValue(e.target.value)}
                                          min="0"
                                          style={{ fontSize: 13 }}
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={handleAddCharge}
                                      disabled={chargeSaving}
                                      style={{
                                        padding: "6px 18px",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#fff",
                                        background: chargeSaving ? "#94a3b8" : "#10b981",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: chargeSaving ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      {chargeSaving ? "Saving..." : "Save Charge"}
                                    </button>
                                  </div>
                                )}

                                {chargeMessage && (
                                  <div style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    marginBottom: 10,
                                    background: chargeMessage.includes("success") ? "#d4edda" : "#f8d7da",
                                    color: chargeMessage.includes("success") ? "#155724" : "#721c24",
                                    fontSize: 12,
                                  }}>
                                    {chargeMessage}
                                  </div>
                                )}

                                {charges.length > 0 ? (
                                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                      <thead>
                                        <tr style={{ background: "#f1f5f9" }}>
                                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Charge Name</th>
                                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Type</th>
                                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#475569" }}>Value</th>
                                          <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {charges.map((c) => (
                                          <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "8px 12px" }}>{c.chargeName}</td>
                                            <td style={{ padding: "8px 12px" }}>
                                              <span style={{
                                                padding: "2px 8px",
                                                borderRadius: 10,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                background: c.chargeType === "percentage" ? "#dbeafe" : "#e0e7ff",
                                                color: c.chargeType === "percentage" ? "#2563eb" : "#6366f1",
                                              }}>
                                                {c.chargeType === "percentage" ? "%" : "₹"}
                                              </span>
                                            </td>
                                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                                              {c.chargeType === "percentage" ? `${c.chargeValue}%` : `₹${c.chargeValue}`}
                                            </td>
                                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                              <button
                                                onClick={() => handleRemoveCharge(c.id)}
                                                style={{
                                                  background: "none",
                                                  border: "none",
                                                  color: "#ef4444",
                                                  cursor: "pointer",
                                                  fontSize: 12,
                                                  fontWeight: 600,
                                                }}
                                              >
                                                Remove
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div style={{ color: "#94a3b8", fontSize: 13 }}>No additional charges</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
