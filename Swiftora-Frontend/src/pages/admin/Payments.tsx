import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import "./Pages.css";

interface PendingPayment {
  id: string;
  amount: number;
  reference: string | null;
  description: string | null;
  createdAt: string;
  merchant: { companyName: string; email: string };
}

export default function Payments() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingPayments = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPendingPayments();
      setPendingPayments(res.data.payments || []);
    } catch (err) {
      console.error("Failed to load pending payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this payment? The vendor's wallet will be credited.")) return;
    setProcessingId(id);
    try {
      await adminApi.approvePayment(id);
      setPendingPayments(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to approve payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this payment? The vendor will be notified.")) return;
    setProcessingId(id);
    try {
      await adminApi.rejectPayment(id);
      setPendingPayments(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (val: number) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Payments</h2>
        <button
          className="action-btn btn-view"
          style={{ padding: "0.5rem 1rem" }}
          onClick={loadPendingPayments}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Pending QR Payments ({pendingPayments.length})
        </h3>
        <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
          Vendors who paid via QR code and submitted their UTR reference. Approve to credit their wallet.
        </p>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Amount</th>
                <th>UTR Reference</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.length > 0 ? (
                pendingPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="fw-medium">{payment.merchant?.companyName || "-"}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{payment.merchant?.email}</div>
                    </td>
                    <td className="wallet-balance" style={{ fontWeight: 600 }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td>
                      <code style={{
                        background: "#f3f4f6",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 13,
                      }}>
                        {payment.reference || "-"}
                      </code>
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="action-btn btn-edit"
                          style={{ padding: "4px 12px", fontSize: 12 }}
                          onClick={() => handleApprove(payment.id)}
                          disabled={processingId === payment.id}
                        >
                          {processingId === payment.id ? "..." : "Approve"}
                        </button>
                        <button
                          className="action-btn btn-delete"
                          style={{ padding: "4px 12px", fontSize: 12 }}
                          onClick={() => handleReject(payment.id)}
                          disabled={processingId === payment.id}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data-cell">
                    No pending QR payments
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
