import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import { toast } from "sonner";
import "./Pages.css";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  merchantId?: string;
  merchant?: {
    id: string;
    companyName: string;
    kycStatus: string;
  };
}

interface KycDetail {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  kycStatus: string;
  kycVerifiedAt: string | null;
  kycVerifiedBy: string | null;
  panNumber: string | null;
  panImageUrl: string | null;
  aadhaarImageUrl: string | null;
  gstNumber: string | null;
  gstCertificateUrl: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  cancelledChequeUrl: string | null;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://swiftora-final.onrender.com';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // KYC detail modal
  const [kycModal, setKycModal] = useState<KycDetail | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Image viewer
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers();
      const nonSupport = response.data.filter((u: User) => u.role !== "SUPPORT");
      setUsers(nonSupport);
      setFilteredUsers(nonSupport);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = users;
    if (searchTerm) {
      result = result.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      result = result.filter(user => user.role?.toLowerCase() === roleFilter.toLowerCase());
    }
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter(user => user.isActive === isActive);
    }
    if (kycFilter !== "all") {
      result = result.filter(user => user.merchant?.kycStatus === kycFilter);
    }
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter, kycFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingRoleId(userId);
      await adminApi.updateUserRole(userId, newRole);
      if (newRole === "SUPPORT") {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success("User moved to Customer Support");
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast.success(`User role updated to ${newRole}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const openKycDetail = async (merchantId: string) => {
    try {
      setKycLoading(true);
      const res = await adminApi.getKycMerchantDetail(merchantId);
      setKycModal(res.data.merchant);
    } catch (err: any) {
      toast.error("Failed to load KYC details");
    } finally {
      setKycLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!kycModal) return;
    try {
      setActionLoading(true);
      await adminApi.approveKyc(kycModal.id);
      toast.success("KYC approved successfully");
      setKycModal({ ...kycModal, kycStatus: "VERIFIED" });
      setUsers(prev => prev.map(u =>
        u.merchant?.id === kycModal.id
          ? { ...u, merchant: { ...u.merchant!, kycStatus: "VERIFIED" } }
          : u
      ));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to approve KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!kycModal) return;
    try {
      setActionLoading(true);
      await adminApi.rejectKyc(kycModal.id);
      toast.success("KYC rejected");
      setKycModal({ ...kycModal, kycStatus: "REJECTED" });
      setUsers(prev => prev.map(u =>
        u.merchant?.id === kycModal.id
          ? { ...u, merchant: { ...u.merchant!, kycStatus: "REJECTED" } }
          : u
      ));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reject KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const getKycBadge = (status?: string) => {
    switch (status) {
      case "VERIFIED":
        return <span className="status-badge active">Verified</span>;
      case "PENDING_ADMIN_REVIEW":
        return <span className="status-badge" style={{ background: "#fef3c7", color: "#92400e" }}>Pending Review</span>;
      case "REJECTED":
        return <span className="status-badge" style={{ background: "#fef2f2", color: "#991b1b" }}>Rejected</span>;
      case "NOT_STARTED":
      default:
        return <span className="status-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>Not Started</span>;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'admin';
      case 'SUPPORT': return 'support';
      case 'MANAGER': return 'manager';
      default: return 'user';
    }
  };

  const docUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Users</h2>
        <span className="user-count">{filteredUsers.length} users</span>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search users..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="filter-select" value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
          <option value="all">All KYC</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING_ADMIN_REVIEW">Pending Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="NOT_STARTED">Not Started</option>
        </select>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Company</th>
              <th>KYC Status</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="fw-medium">{user.name || '-'}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role || 'User'}
                    </span>
                  </td>
                  <td>{user.merchant?.companyName || '-'}</td>
                  <td>
                    {user.merchant ? (
                      <span
                        onClick={() => openKycDetail(user.merchant!.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {getKycBadge(user.merchant.kycStatus)}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select
                        className="filter-select"
                        style={{ minWidth: "100px", padding: "4px 8px", fontSize: "0.85em" }}
                        value={user.role || "USER"}
                        disabled={updatingRoleId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="USER">User</option>
                        <option value="MANAGER">Manager</option>
                        <option value="SUPPORT">Support</option>
                        <option value="ADMIN">Admin</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      {user.merchant && (
                        <button
                          className="action-btn btn-view"
                          onClick={() => openKycDetail(user.merchant!.id)}
                          title="View KYC"
                        >
                          KYC
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="no-data-cell">
                  {searchTerm || roleFilter !== "all" || statusFilter !== "all" || kycFilter !== "all"
                    ? "No users match your filters"
                    : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* KYC Detail Modal */}
      {(kycModal || kycLoading) && (
        <div className="modal-overlay" onClick={() => { if (!kycLoading) setKycModal(null); }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 680, maxHeight: "90vh", overflow: "auto" }}
          >
            {kycLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>Loading KYC details...</div>
            ) : kycModal ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>KYC Details</h3>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                      {kycModal.companyName} &mdash; {kycModal.email}
                    </p>
                  </div>
                  {getKycBadge(kycModal.kycStatus)}
                </div>

                {/* Identity Section */}
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                    Identity Verification
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>PAN Number</span>
                      <p style={{ fontWeight: 600, margin: "2px 0" }}>{kycModal.panNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>GST Number</span>
                      <p style={{ fontWeight: 600, margin: "2px 0" }}>{kycModal.gstNumber || "Not provided"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    {kycModal.panImageUrl && (
                      <DocThumb label="PAN Card" url={docUrl(kycModal.panImageUrl)!} onView={setViewingImage} />
                    )}
                    {kycModal.aadhaarImageUrl && (
                      <DocThumb label="Aadhaar" url={docUrl(kycModal.aadhaarImageUrl)!} onView={setViewingImage} />
                    )}
                    {kycModal.gstCertificateUrl && (
                      <DocThumb label="GST Certificate" url={docUrl(kycModal.gstCertificateUrl)!} onView={setViewingImage} />
                    )}
                  </div>
                </div>

                {/* Bank Section */}
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                    Bank Verification
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Account Holder</span>
                      <p style={{ fontWeight: 600, margin: "2px 0" }}>{kycModal.bankAccountName || "Not provided"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Bank Name</span>
                      <p style={{ fontWeight: 600, margin: "2px 0" }}>{kycModal.bankName || "Not provided"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Account Number</span>
                      <p style={{ fontWeight: 600, margin: "2px 0" }}>{kycModal.bankAccountNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>IFSC Code</span>
                      <p style={{ fontWeight: 600, margin: "2px 0" }}>{kycModal.bankIfscCode || "Not provided"}</p>
                    </div>
                  </div>
                  {kycModal.cancelledChequeUrl && (
                    <div style={{ marginTop: 12 }}>
                      <DocThumb label="Cancelled Cheque" url={docUrl(kycModal.cancelledChequeUrl)!} onView={setViewingImage} />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => setKycModal(null)}
                    style={{
                      padding: "10px 24px", borderRadius: 8, border: "1px solid #d1d5db",
                      background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500,
                    }}
                  >
                    Close
                  </button>
                  {kycModal.kycStatus === "PENDING_ADMIN_REVIEW" && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        style={{
                          padding: "10px 24px", borderRadius: 8, border: "none",
                          background: "#ef4444", color: "#fff", cursor: actionLoading ? "not-allowed" : "pointer",
                          fontSize: 14, fontWeight: 600, opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        Reject KYC
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        style={{
                          padding: "10px 24px", borderRadius: 8, border: "none",
                          background: "#16a34a", color: "#fff", cursor: actionLoading ? "not-allowed" : "pointer",
                          fontSize: 14, fontWeight: 600, opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        Approve KYC
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Image Viewer Overlay */}
      {viewingImage && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={() => setViewingImage(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingImage}
              alt="Document"
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
              <a
                href={viewingImage}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 24px", borderRadius: 8, background: "#fff", color: "#374151",
                  textDecoration: "none", fontWeight: 600, fontSize: 14,
                }}
              >
                Download
              </a>
              <button
                onClick={() => setViewingImage(null)}
                style={{
                  padding: "8px 24px", borderRadius: 8, background: "#1e293b", color: "#fff",
                  border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocThumb({ label, url, onView }: { label: string; url: string; onView: (url: string) => void }) {
  const isPdf = url.toLowerCase().endsWith(".pdf");
  return (
    <div
      onClick={() => isPdf ? window.open(url, "_blank") : onView(url)}
      style={{
        width: 120, borderRadius: 10, border: "1px solid #e2e8f0",
        overflow: "hidden", cursor: "pointer", background: "#fff",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {isPdf ? (
        <div style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
          <span style={{ fontSize: 24 }}>PDF</span>
        </div>
      ) : (
        <img src={url} alt={label} style={{ width: "100%", height: 72, objectFit: "cover" }} />
      )}
      <div style={{ padding: "6px 8px", fontSize: 11, fontWeight: 600, color: "#475569", textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
}
