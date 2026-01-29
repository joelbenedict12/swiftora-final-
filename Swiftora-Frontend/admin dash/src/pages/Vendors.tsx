import { useState } from "react";
import "./Pages.css";

export default function Vendors() {
  const [vendors] = useState([
    {
      id: 1,
      name: "Tech Store",
      service: "Electronics",
      commission: "10%",
      status: "Approved",
    },
    {
      id: 2,
      name: "Fashion Hub",
      service: "Clothing",
      commission: "12%",
      status: "Pending",
    },
    {
      id: 3,
      name: "Fresh Foods",
      service: "Groceries",
      commission: "8%",
      status: "Rejected",
    },
    {
      id: 4,
      name: "Gadget World",
      service: "Electronics",
      commission: "10%",
      status: "Approved",
    },
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🏪 Vendors</h2>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search vendors..."
          className="search-input"
        />
        <select className="filter-select">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Service Category</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>{vendor.name}</td>
                <td>{vendor.service}</td>
                <td>{vendor.commission}</td>
                <td>
                  <span
                    className={`status-badge ${vendor.status.toLowerCase()}`}
                  >
                    {vendor.status}
                  </span>
                </td>
                <td>
                  {vendor.status === "Pending" && (
                    <>
                      <button className="action-btn btn-edit">Approve</button>
                      <button className="action-btn btn-delete">Reject</button>
                    </>
                  )}
                  <button className="action-btn btn-view">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
