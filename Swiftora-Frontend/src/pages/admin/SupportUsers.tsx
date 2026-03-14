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

export default function SupportUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers();
      const supportOnly = response.data.filter((u: User) => u.role === "SUPPORT");
      setUsers(supportOnly);
      setFilteredUsers(supportOnly);
    } catch (error) {
      console.error("Failed to load support users:", error);
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
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter(user => user.isActive === isActive);
    }
    setFilteredUsers(result);
  }, [users, searchTerm, statusFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingRoleId(userId);
      await adminApi.updateUserRole(userId, newRole);
      if (newRole !== "SUPPORT") {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success(`User moved to Users page as ${newRole}`);
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast.success(`Role updated to ${newRole}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading support users...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Customer Support</h2>
        <span className="user-count">{filteredUsers.length} support staff</span>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search support staff..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
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
                  <td>{user.merchant?.companyName || '-'}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="filter-select"
                      style={{ minWidth: "100px", padding: "4px 8px", fontSize: "0.85em" }}
                      value={user.role || "SUPPORT"}
                      disabled={updatingRoleId === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="USER">User</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPPORT">Support</option>
                      <option value="ADMIN">Admin</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="no-data-cell">
                  {searchTerm || statusFilter !== "all"
                    ? "No support staff match your filters"
                    : "No support staff found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
