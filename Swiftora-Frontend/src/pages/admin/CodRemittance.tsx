import { useState, useEffect } from "react";
import { toast } from "sonner";
import { codRemittanceApi } from "@/lib/api";
import "./Pages.css";

type AdminStats = {
    totalCod: number;
    pendingSettlement: number;
    platformEarnings: number;
    totalPaid: number;
    totalRecords: number;
};

type Remittance = {
    id: string;
    merchantId: string;
    awbNumber: string;
    courierPartner: string;
    codAmount: string;
    courierCharges: string;
    platformFee: string;
    netPayable: string;
    status: string;
    remittanceRef: string | null;
    transactionId: string | null;
    transferDate: string | null;
    createdAt: string;
    order: { orderNumber: string; customerName: string; status: string };
    merchant: { companyName: string; email: string };
};

const fmtINR = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const statusBadgeStyle: Record<string, React.CSSProperties> = {
    PENDING: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
    RECEIVED_FROM_COURIER: { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
    PAID_TO_VENDOR: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
};

const statusLabel: Record<string, string> = {
    PENDING: "⏳ Pending",
    RECEIVED_FROM_COURIER: "📦 Received",
    PAID_TO_VENDOR: "✅ Paid",
};

export default function CodRemittance() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [remittances, setRemittances] = useState<Remittance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [courierFilter, setCourierFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog state
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dialogMode, setDialogMode] = useState<"receive" | "pay" | null>(null);
    const [courierCharges, setCourierCharges] = useState("0");
    const [platformFee, setPlatformFee] = useState("0");
    const [txnId, setTxnId] = useState("");
    const [remRef, setRemRef] = useState("");

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [statsRes, listRes] = await Promise.all([
                codRemittanceApi.adminStats(),
                codRemittanceApi.adminList({
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    courier: courierFilter !== "all" ? courierFilter : undefined,
                    search: searchQuery || undefined,
                    page,
                    limit: 20,
                }),
            ]);
            setStats(statsRes.data);
            setRemittances(listRes.data.remittances);
            setTotalPages(listRes.data.totalPages || 1);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to load remittance data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [statusFilter, courierFilter, page]);

    const handleReceive = async () => {
        if (!selectedId) return;
        try {
            await codRemittanceApi.markReceived(selectedId, {
                courierCharges: parseFloat(courierCharges) || 0,
                platformFee: parseFloat(platformFee) || 0,
            });
            toast.success("Marked as received from courier");
            setDialogMode(null);
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update");
        }
    };

    const handlePay = async () => {
        if (!selectedId) return;
        try {
            await codRemittanceApi.markPaid(selectedId, {
                transactionId: txnId || undefined,
                remittanceRef: remRef || undefined,
            });
            toast.success("Marked as paid to vendor");
            setDialogMode(null);
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update");
        }
    };

    if (isLoading && !stats) {
        return <div className="page-container"><div className="loading-state">Loading COD Remittance data...</div></div>;
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <h2>COD Remittance</h2>
                <button className="action-btn btn-view" style={{ padding: "0.5rem 1rem" }} onClick={loadData}>
                    ↻ Refresh
                </button>
            </div>
            <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
                Track and manage COD settlements across all vendors
            </p>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Total COD Collected", value: fmtINR(stats?.totalCod || 0), color: "#1e293b", bg: "#f8fafc", border: "#e2e8f0" },
                    { label: "Pending Settlement", value: fmtINR(stats?.pendingSettlement || 0), color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
                    { label: "Total Paid", value: fmtINR(stats?.totalPaid || 0), color: "#059669", bg: "#f0fdf4", border: "#86efac" },
                    { label: "Platform Earnings", value: fmtINR(stats?.platformEarnings || 0), color: "#7c3aed", bg: "#faf5ff", border: "#c4b5fd" },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 12, padding: "20px 24px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder="🔍 Search AWB / Order..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (() => { setPage(1); loadData(); })()}
                    style={{
                        padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
                        width: 240, outline: "none",
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="RECEIVED_FROM_COURIER">Received</option>
                    <option value="PAID_TO_VENDOR">Paid</option>
                </select>
                <select
                    value={courierFilter}
                    onChange={(e) => { setCourierFilter(e.target.value); setPage(1); }}
                    style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                >
                    <option value="all">All Couriers</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Blitz">Blitz</option>
                    <option value="Ekart">Ekart</option>
                    <option value="Xpressbees">Xpressbees</option>
                </select>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Vendor</th>
                            <th>AWB</th>
                            <th>Courier</th>
                            <th>COD Amount</th>
                            <th>Deductions</th>
                            <th>Net Payable</th>
                            <th>Status</th>
                            <th>Transfer Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {remittances.length > 0 ? (
                            remittances.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600, color: "#2563eb" }}>{r.order?.orderNumber || "-"}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{r.merchant?.companyName || "-"}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>{r.merchant?.email}</div>
                                    </td>
                                    <td>
                                        <code style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                                            {r.awbNumber}
                                        </code>
                                    </td>
                                    <td>{r.courierPartner}</td>
                                    <td style={{ fontWeight: 600 }}>{fmtINR(Number(r.codAmount))}</td>
                                    <td style={{ color: "#dc2626", fontSize: 13 }}>
                                        -{fmtINR(Number(r.courierCharges) + Number(r.platformFee))}
                                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                            C: {fmtINR(Number(r.courierCharges))} | P: {fmtINR(Number(r.platformFee))}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: "#059669" }}>{fmtINR(Number(r.netPayable))}</td>
                                    <td>
                                        <span style={statusBadgeStyle[r.status] || statusBadgeStyle.PENDING}>
                                            {statusLabel[r.status] || r.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: "#6b7280" }}>
                                        {r.transferDate ? new Date(r.transferDate).toLocaleDateString("en-IN") : "-"}
                                    </td>
                                    <td>
                                        {r.status === "PENDING" && (
                                            <button
                                                className="action-btn btn-edit"
                                                style={{ padding: "4px 12px", fontSize: 12 }}
                                                onClick={() => {
                                                    setSelectedId(r.id);
                                                    setCourierCharges("0");
                                                    setPlatformFee("0");
                                                    setDialogMode("receive");
                                                }}
                                            >
                                                Mark Received
                                            </button>
                                        )}
                                        {r.status === "RECEIVED_FROM_COURIER" && (
                                            <button
                                                className="action-btn btn-edit"
                                                style={{ padding: "4px 12px", fontSize: 12, background: "#059669", color: "#fff" }}
                                                onClick={() => {
                                                    setSelectedId(r.id);
                                                    setTxnId("");
                                                    setRemRef("");
                                                    setDialogMode("pay");
                                                }}
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        {r.status === "PAID_TO_VENDOR" && (
                                            <span style={{ color: "#059669", fontSize: 13, fontWeight: 500 }}>✓ Settled</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="no-data-cell">
                                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                                        <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                                        <div style={{ fontWeight: 600, color: "#374151" }}>No COD remittance records</div>
                                        <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                                            Records are automatically created when COD orders are delivered
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "0 4px" }}>
                    <span style={{ color: "#6b7280", fontSize: 14 }}>Page {page} of {totalPages}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="action-btn btn-view" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "4px 14px", fontSize: 13 }}>
                            ← Prev
                        </button>
                        <button className="action-btn btn-view" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "4px 14px", fontSize: 13 }}>
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* === RECEIVE DIALOG === */}
            {dialogMode === "receive" && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
                    onClick={() => setDialogMode(null)}
                >
                    <div
                        style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Mark as Received from Courier</h3>
                        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
                            Enter deductions to calculate the net payable amount to the vendor.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Courier Charges (₹)</label>
                                <input
                                    type="number"
                                    value={courierCharges}
                                    onChange={(e) => setCourierCharges(e.target.value)}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Platform Fee (₹)</label>
                                <input
                                    type="number"
                                    value={platformFee}
                                    onChange={(e) => setPlatformFee(e.target.value)}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
                            <button className="action-btn btn-view" onClick={() => setDialogMode(null)} style={{ padding: "8px 20px" }}>Cancel</button>
                            <button className="action-btn btn-edit" onClick={handleReceive} style={{ padding: "8px 20px" }}>Confirm Receipt</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === PAY DIALOG === */}
            {dialogMode === "pay" && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
                    onClick={() => setDialogMode(null)}
                >
                    <div
                        style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Mark as Paid to Vendor</h3>
                        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
                            Enter the transaction details for audit trail.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Transaction ID</label>
                                <input
                                    type="text"
                                    value={txnId}
                                    onChange={(e) => setTxnId(e.target.value)}
                                    placeholder="e.g. TXN-123456"
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Remittance Reference</label>
                                <input
                                    type="text"
                                    value={remRef}
                                    onChange={(e) => setRemRef(e.target.value)}
                                    placeholder="e.g. REM-2026-001"
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
                            <button className="action-btn btn-view" onClick={() => setDialogMode(null)} style={{ padding: "8px 20px" }}>Cancel</button>
                            <button className="action-btn btn-edit" onClick={handlePay} style={{ padding: "8px 20px", background: "#059669", color: "#fff" }}>Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
