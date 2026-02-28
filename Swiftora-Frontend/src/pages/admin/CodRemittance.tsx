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

const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

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
            setSelectedId(null);
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
            setSelectedId(null);
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update");
        }
    };

    const openReceiveDialog = (id: string) => {
        setSelectedId(id);
        setCourierCharges("0");
        setPlatformFee("0");
        setDialogMode("receive");
    };

    const openPayDialog = (id: string) => {
        setSelectedId(id);
        setTxnId("");
        setRemRef("");
        setDialogMode("pay");
    };

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            PENDING: { label: "Pending", cls: "status-badge pending" },
            RECEIVED_FROM_COURIER: { label: "Received", cls: "status-badge active" },
            PAID_TO_VENDOR: { label: "Paid", cls: "status-badge completed" },
        };
        const s = map[status] || map.PENDING;
        return <span className={s.cls}>{s.label}</span>;
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>COD Remittance Management</h1>
                <p>Track and manage COD settlements across all vendors</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <div className="stat-card">
                    <div className="stat-label">Total COD Collected</div>
                    <div className="stat-value">{fmt(stats?.totalCod || 0)}</div>
                </div>
                <div className="stat-card" style={{ borderColor: "#f59e0b" }}>
                    <div className="stat-label">Pending Settlement</div>
                    <div className="stat-value" style={{ color: "#f59e0b" }}>{fmt(stats?.pendingSettlement || 0)}</div>
                </div>
                <div className="stat-card" style={{ borderColor: "#10b981" }}>
                    <div className="stat-label">Total Paid</div>
                    <div className="stat-value" style={{ color: "#10b981" }}>{fmt(stats?.totalPaid || 0)}</div>
                </div>
                <div className="stat-card" style={{ borderColor: "#6366f1" }}>
                    <div className="stat-label">Platform Earnings</div>
                    <div className="stat-value" style={{ color: "#6366f1" }}>{fmt(stats?.platformEarnings || 0)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="table-container">
                <div className="table-header">
                    <h2>All Remittances</h2>
                    <div className="table-actions">
                        <input
                            type="text"
                            placeholder="Search AWB / Order..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (() => { setPage(1); loadData(); })()}
                            className="search-input"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="RECEIVED_FROM_COURIER">Received</option>
                            <option value="PAID_TO_VENDOR">Paid</option>
                        </select>
                        <select
                            value={courierFilter}
                            onChange={(e) => { setCourierFilter(e.target.value); setPage(1); }}
                            className="filter-select"
                        >
                            <option value="all">All Courier</option>
                            <option value="Delhivery">Delhivery</option>
                            <option value="Blitz">Blitz</option>
                            <option value="Ekart">Ekart</option>
                            <option value="Xpressbees">Xpressbees</option>
                        </select>
                        <button onClick={loadData} className="btn btn-outline" style={{ padding: "6px 12px" }}>↻ Refresh</button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state">Loading remittances...</div>
                ) : remittances.length === 0 ? (
                    <div className="empty-state">
                        <p>No COD remittance records found</p>
                        <small>Records are created when COD orders are delivered</small>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Vendor</th>
                                    <th>AWB</th>
                                    <th>Courier</th>
                                    <th>COD Amount</th>
                                    <th>Charges</th>
                                    <th>Net Payable</th>
                                    <th>Status</th>
                                    <th>Transfer Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {remittances.map((r) => (
                                    <tr key={r.id}>
                                        <td className="font-medium">{r.order?.orderNumber || "-"}</td>
                                        <td>{r.merchant?.companyName || "-"}</td>
                                        <td><code style={{ fontSize: "12px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>{r.awbNumber}</code></td>
                                        <td>{r.courierPartner}</td>
                                        <td className="font-semibold">{fmt(Number(r.codAmount))}</td>
                                        <td style={{ color: "#dc2626", fontSize: "13px" }}>
                                            -{fmt(Number(r.courierCharges) + Number(r.platformFee))}
                                        </td>
                                        <td className="font-semibold" style={{ color: "#059669" }}>{fmt(Number(r.netPayable))}</td>
                                        <td>{statusBadge(r.status)}</td>
                                        <td style={{ fontSize: "13px" }}>{r.transferDate ? new Date(r.transferDate).toLocaleDateString("en-IN") : "-"}</td>
                                        <td>
                                            {r.status === "PENDING" && (
                                                <button className="btn btn-primary btn-sm" onClick={() => openReceiveDialog(r.id)}>
                                                    Mark Received
                                                </button>
                                            )}
                                            {r.status === "RECEIVED_FROM_COURIER" && (
                                                <button className="btn btn-primary btn-sm" style={{ background: "#059669" }} onClick={() => openPayDialog(r.id)}>
                                                    Mark Paid
                                                </button>
                                            )}
                                            {r.status === "PAID_TO_VENDOR" && (
                                                <span style={{ color: "#059669", fontSize: "13px" }}>✓ Settled</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <span>Page {page} of {totalPages}</span>
                                <div>
                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">← Prev</button>
                                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">Next →</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Receive Dialog */}
            {dialogMode === "receive" && (
                <div className="modal-overlay" onClick={() => setDialogMode(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                        <h3>Mark as Received from Courier</h3>
                        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
                            Enter deductions to calculate net payable amount.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Courier Charges (₹)</label>
                                <input type="number" value={courierCharges} onChange={(e) => setCourierCharges(e.target.value)} className="search-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Platform Fee (₹)</label>
                                <input type="number" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} className="search-input" style={{ width: "100%" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                            <button className="btn btn-outline" onClick={() => setDialogMode(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleReceive}>Confirm Receipt</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Dialog */}
            {dialogMode === "pay" && (
                <div className="modal-overlay" onClick={() => setDialogMode(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                        <h3>Mark as Paid to Vendor</h3>
                        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
                            Enter transaction details for the settlement.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Transaction ID</label>
                                <input type="text" value={txnId} onChange={(e) => setTxnId(e.target.value)} className="search-input" style={{ width: "100%" }} placeholder="e.g. TXN-123456" />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Remittance Reference</label>
                                <input type="text" value={remRef} onChange={(e) => setRemRef(e.target.value)} className="search-input" style={{ width: "100%" }} placeholder="e.g. REM-2026-001" />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                            <button className="btn btn-outline" onClick={() => setDialogMode(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ background: "#059669" }} onClick={handlePay}>Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
