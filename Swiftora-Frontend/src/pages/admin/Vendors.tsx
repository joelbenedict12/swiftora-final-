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

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search vendors..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Wallet Balance</th>
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
                  <td className="wallet-balance">{formatCurrency(vendor.walletBalance)}</td>
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
                <td colSpan={7} className="no-data-cell">
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
