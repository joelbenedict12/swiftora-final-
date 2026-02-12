import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import "./Dashboard.css";

interface Invoice {
    id: string;
    invoiceNumber: string;
    merchantId: string;
    merchant?: { companyName?: string; name?: string };
    month: number;
    year: number;
    totalAmount: number;
    totalShipments: number;
    totalCourierCost: number;
    totalVendorCharge: number;
    totalProfit: number;
    status: string;
    createdAt: string;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function Invoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGenerate, setShowGenerate] = useState(false);
    const [genForm, setGenForm] = useState({
        merchantId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const [filterStatus, setFilterStatus] = useState("");

    const loadInvoices = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params: Record<string, string> = {};
            if (filterStatus) params.status = filterStatus;
            const res = await adminApi.getInvoices(params);
            setInvoices(res.data?.invoices || res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load invoices");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, [filterStatus]);

    const handleGenerate = async () => {
        if (!genForm.merchantId.trim()) {
            alert("Enter a Merchant ID");
            return;
        }
        try {
            await adminApi.generateInvoice(genForm);
            setShowGenerate(false);
            setGenForm({ merchantId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear() });
            loadInvoices();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to generate invoice");
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await adminApi.updateInvoiceStatus(id, { status });
            loadInvoices();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to update status");
        }
    };

    const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString()}`;

    if (isLoading) {
        return (
            <div className="dashboard loading-state">
                <div className="loading-spinner">Loading invoices...</div>
            </div>
        );
    }

    const inputStyle: React.CSSProperties = {
        padding: "7px 12px",
        borderRadius: 6,
        border: "1px solid #cbd5e1",
        fontSize: 13,
        color: "#0f172a",
        width: "100%",
    };

    const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff" };

    return (
        <div className="dashboard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        📄 Invoice Management
                    </h2>
                    <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
                        Generate and manage vendor invoices
                    </p>
                </div>
                <button
                    onClick={() => setShowGenerate(!showGenerate)}
                    style={{
                        padding: "8px 20px",
                        borderRadius: 6,
                        border: "none",
                        background: "#4f46e5",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                    }}
                >
                    {showGenerate ? "Cancel" : "+ Generate Invoice"}
                </button>
            </div>

            {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* Generate Form */}
            {showGenerate && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#0f172a" }}>
                        Generate Monthly Invoice
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Merchant ID</label>
                            <input
                                type="text"
                                value={genForm.merchantId}
                                onChange={(e) => setGenForm({ ...genForm, merchantId: e.target.value })}
                                placeholder="Enter merchant ID"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Month</label>
                            <select value={genForm.month} onChange={(e) => setGenForm({ ...genForm, month: Number(e.target.value) })} style={selectStyle}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Year</label>
                            <input
                                type="number"
                                value={genForm.year}
                                onChange={(e) => setGenForm({ ...genForm, year: Number(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                        <button onClick={handleGenerate} style={{ padding: "8px 24px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                            Generate
                        </button>
                        <button onClick={() => setShowGenerate(false)} style={{ padding: "8px 24px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...selectStyle, width: 180 }}>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                </select>
            </div>

            {/* Table */}
            <section className="recent-activity-card">
                <div className="table-responsive">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Vendor</th>
                                <th>Period</th>
                                <th>Shipments</th>
                                <th>Amount</th>
                                <th>Profit</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? (
                                invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="fw-medium">{inv.invoiceNumber}</td>
                                        <td>{inv.merchant?.companyName || inv.merchant?.name || inv.merchantId}</td>
                                        <td>{MONTHS[(inv.month || 1) - 1]} {inv.year}</td>
                                        <td>{inv.totalShipments || 0}</td>
                                        <td>{formatCurrency(inv.totalAmount)}</td>
                                        <td style={{ color: (inv.totalProfit || 0) >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                            {formatCurrency(inv.totalProfit)}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${inv.status?.toLowerCase() === "paid" ? "completed" : inv.status?.toLowerCase() === "overdue" ? "cancelled" : "pending"}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={inv.status}
                                                onChange={(e) => handleStatusUpdate(inv.id, e.target.value)}
                                                style={{ ...selectStyle, width: 110, padding: "3px 8px", fontSize: 12 }}
                                            >
                                                <option value="DRAFT">Draft</option>
                                                <option value="SENT">Sent</option>
                                                <option value="PAID">Paid</option>
                                                <option value="OVERDUE">Overdue</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="no-data-cell">
                                        No invoices found. Click "+ Generate Invoice" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
