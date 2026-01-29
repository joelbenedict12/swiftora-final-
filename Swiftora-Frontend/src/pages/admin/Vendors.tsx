import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import "./Pages.css";

interface Vendor {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  walletBalance: number;
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

  useEffect(() => {
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
        <h2>🏪 Vendors</h2>
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
              <th>Phone</th>
              <th>Wallet Balance</th>
              <th>Orders</th>
              <th>Users</th>
              <th>Warehouses</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="fw-medium">{vendor.companyName || '-'}</td>
                  <td>{vendor.email || '-'}</td>
                  <td>{vendor.phone || '-'}</td>
                  <td className="wallet-balance">{formatCurrency(vendor.walletBalance)}</td>
                  <td>{vendor.orderCount}</td>
                  <td>{vendor.userCount}</td>
                  <td>{vendor.warehouseCount}</td>
                  <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
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
