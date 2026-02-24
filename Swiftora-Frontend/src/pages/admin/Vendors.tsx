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

  useEffect(() => {
    loadVendors();
  }, []);

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

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString()}`;
  };

  const handleTogglePause = async (vendor: Vendor) => {
    const newPaused = !vendor.isPaused;
    const action = newPaused ? "pause" : "unpause";
    if (!confirm(`Are you sure you want to ${action} ${vendor.companyName || vendor.email}?`)) return;

    setTogglingId(vendor.id);
    try {
      await adminApi.toggleVendorPause(vendor.id, newPaused);
      setVendors(prev =>
        prev.map(v => v.id === vendor.id ? { ...v, isPaused: newPaused } : v)
      );
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

  const cancelEditType = () => {
    setEditingId(null);
    setEditType("CASH");
    setEditCreditLimit("");
  };

  const saveCustomerType = async (vendorId: string) => {
    setSavingType(true);
    try {
      await adminApi.updateCustomerType(vendorId, {
        customerType: editType,
        creditLimit: editType === "CREDIT" ? Number(editCreditLimit) : 0,
      });
      setVendors(prev =>
        prev.map(v =>
          v.id === vendorId
            ? { ...v, customerType: editType, creditLimit: editType === "CREDIT" ? Number(editCreditLimit) : 0 }
            : v
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
      alert(
        `Invoices generated: ${data.generated?.length || 0}\n` +
        `Skipped: ${data.skipped?.length || 0}\n` +
        `Errors: ${data.errors?.length || 0}`
      );
    } catch (err: any) {
      console.error("Failed to generate invoices:", err);
      alert(err?.response?.data?.error || "Failed to generate invoices");
    } finally {
      setGeneratingInvoices(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Vendors</h2>
        <span className="user-count">{filteredVendors.length} vendors</span>
      </div>

      <div className="filters-bar" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search vendors..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="month"
            value={invoiceMonth}
            onChange={(e) => setInvoiceMonth(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
            placeholder="Month (optional)"
          />
          <button
            className="action-btn btn-view"
            style={{ padding: "6px 16px", fontSize: "13px", whiteSpace: "nowrap" }}
            onClick={handleGenerateInvoices}
            disabled={generatingInvoices}
          >
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
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as "CASH" | "CREDIT")}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                        >
                          <option value="CASH">CASH</option>
                          <option value="CREDIT">CREDIT</option>
                        </select>
                        {editType === "CREDIT" && (
                          <input
                            type="number"
                            placeholder="Credit Limit"
                            value={editCreditLimit}
                            onChange={(e) => setEditCreditLimit(e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px", width: "120px" }}
                          />
                        )}
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="action-btn btn-view"
                            style={{ padding: "2px 8px", fontSize: "11px" }}
                            onClick={() => saveCustomerType(vendor.id)}
                            disabled={savingType}
                          >
                            {savingType ? "..." : "Save"}
                          </button>
                          <button
                            className="action-btn"
                            style={{ padding: "2px 8px", fontSize: "11px" }}
                            onClick={cancelEditType}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        className="status-badge"
                        style={{
                          background: vendor.customerType === "CREDIT" ? "#dbeafe" : "#f3f4f6",
                          color: vendor.customerType === "CREDIT" ? "#1e40af" : "#374151",
                          cursor: "pointer",
                        }}
                        onClick={() => startEditType(vendor)}
                        title="Click to change"
                      >
                        {vendor.customerType || "CASH"}
                      </span>
                    )}
                  </td>
                  <td className="wallet-balance">
                    {vendor.customerType === "CREDIT"
                      ? `Limit: ${formatCurrency(vendor.creditLimit)}`
                      : formatCurrency(vendor.walletBalance)
                    }
                  </td>
                  <td>
                    {vendor.isPaused ? (
                      <span className="status-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
                        Paused
                      </span>
                    ) : (
                      <span className="status-badge" style={{ background: "#dcfce7", color: "#166534" }}>
                        Active
                      </span>
                    )}
                  </td>
                  <td>{vendor.orderCount}</td>
                  <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`action-btn ${vendor.isPaused ? "btn-view" : "btn-delete"}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => handleTogglePause(vendor)}
                      disabled={togglingId === vendor.id}
                    >
                      {togglingId === vendor.id
                        ? "..."
                        : vendor.isPaused
                          ? "Unpause"
                          : "Pause"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data-cell">
                  {searchTerm ? "No vendors match your search" : "No vendors found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
