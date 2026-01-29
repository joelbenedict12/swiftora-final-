import { useState } from "react";
import "./Pages.css";

export default function Payments() {
  const [payouts] = useState([
    {
      id: 1,
      vendor: "Tech Store",
      amount: "₹12,000",
      commission: "₹1,200",
      status: "Paid",
      date: "2023-10-01",
    },
    {
      id: 2,
      vendor: "Fashion Hub",
      amount: "₹8,500",
      commission: "₹1,020",
      status: "Pending",
      date: "2023-10-05",
    },
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>💰 Payments</h2>
        <button
          className="action-btn btn-view"
          style={{ padding: "0.5rem 1rem" }}
        >
          Export CSV
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Total Amount</th>
              <th>Platform Commission</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td>{payout.vendor}</td>
                <td>{payout.amount}</td>
                <td>{payout.commission}</td>
                <td>{payout.date}</td>
                <td>
                  <span
                    className={`status-badge ${payout.status.toLowerCase()}`}
                  >
                    {payout.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn btn-view">Details</button>
                  {payout.status === "Pending" && (
                    <button className="action-btn btn-edit">Process</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
