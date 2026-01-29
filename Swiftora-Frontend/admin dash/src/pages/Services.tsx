import { useState } from "react";
import "./Pages.css";

export default function Services() {
  const [services] = useState([
    {
      id: 1,
      name: "House Cleaning",
      category: "Home",
      price: "$50/hr",
      status: "Active",
    },
    {
      id: 2,
      name: "Plumbing",
      category: "Maintenance",
      price: "$80/hr",
      status: "Active",
    },
    {
      id: 3,
      name: "Web Design",
      category: "Digital",
      price: "Fixed",
      status: "Inactive",
    },
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📦 Services</h2>
        <button
          className="action-btn btn-edit"
          style={{ padding: "0.5rem 1rem" }}
        >
          + Add Service
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Price Model</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.category}</td>
                <td>{service.price}</td>
                <td>
                  <span
                    className={`status-badge ${service.status.toLowerCase()}`}
                  >
                    {service.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn btn-edit">Edit</button>
                  <button className="action-btn btn-block">Disable</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
