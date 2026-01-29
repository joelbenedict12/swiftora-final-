import { useState } from "react";
import "./Pages.css";

export default function Orders() {
  const [orders] = useState([
    {
      id: "#ORD-1001",
      customer: "John Doe",
      amount: "₹1,200",
      status: "Processing",
      date: "2023-10-25",
    },
    {
      id: "#ORD-1002",
      customer: "Jane Smith",
      amount: "₹850",
      status: "Shipped",
      date: "2023-10-24",
    },
    {
      id: "#ORD-1003",
      customer: "Mike Ross",
      amount: "₹2,400",
      status: "Delivered",
      date: "2023-10-23",
    },
    {
      id: "#ORD-1004",
      customer: "Rachel Green",
      amount: "₹500",
      status: "Cancelled",
      date: "2023-10-22",
    },
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🧾 Orders</h2>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search orders..."
          className="search-input"
        />
        <select className="filter-select">
          <option value="all">All Status</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.amount}</td>
                <td>{order.date}</td>
                <td>
                  <span
                    className={`status-badge ${order.status.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn btn-view">Track</button>
                  <button className="action-btn btn-view">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
