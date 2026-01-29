import { useState } from "react";
import "./Pages.css";

export default function Users() {
  const [users] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "Customer",
      status: "Active",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      role: "Vendor",
      status: "Blocked",
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      role: "Customer",
      status: "Active",
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 5,
      name: "Evan Wright",
      email: "evan@example.com",
      role: "Customer",
      status: "Active",
    },
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>👤 Users</h2>
        <button
          className="action-btn btn-edit"
          style={{ padding: "0.5rem 1rem" }}
        >
          + Add User
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search users..."
          className="search-input"
        />
        <select className="filter-select">
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </select>
        <select className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn btn-view">View</button>
                  <button className="action-btn btn-block">Block</button>
                  <button className="action-btn btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="page-btn">Previous</button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">Next</button>
      </div>
    </div>
  );
}
