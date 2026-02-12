import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import "./Dashboard.css";

interface RateCard {
    id: string;
    accountType: string;
    courierName: string;
    marginType: string;
    marginValue: number;
    minWeight: number | null;
    maxWeight: number | null;
    createdAt: string;
}

const COURIERS = ["DELHIVERY", "BLITZ", "EKART", "XPRESSBEES", "INNOFULFILL"];
const ACCOUNT_TYPES = ["B2C", "B2B"];
const MARGIN_TYPES = ["PERCENTAGE", "FLAT"];

export default function RateCards() {
    const [rateCards, setRateCards] = useState<RateCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        accountType: "B2C",
        courierName: "DELHIVERY",
        marginType: "PERCENTAGE",
        marginValue: 15,
        minWeight: 0,
        maxWeight: 999,
    });
    const [filterCourier, setFilterCourier] = useState("");
    const [filterAccount, setFilterAccount] = useState("");

    // Live Rate Calculator
    const [rateCalc, setRateCalc] = useState({
        origin_pin: "",
        destination_pin: "",
        weight: 0.5,
        payment_mode: "Prepaid" as "Prepaid" | "COD",
        cod_amount: 0,
    });
    const [rateResult, setRateResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);

    const handleCalculateRate = async () => {
        if (!rateCalc.origin_pin || !rateCalc.destination_pin || !rateCalc.weight) {
            setRateError("Origin pin, destination pin, and weight are required");
            return;
        }
        try {
            setIsCalculating(true);
            setRateError(null);
            setRateResult(null);
            const res = await adminApi.calculateRate(rateCalc);
            if (res.data?.success) {
                setRateResult(res.data.rate);
            } else {
                setRateError(res.data?.error || "Failed to calculate rate");
            }
        } catch (err: any) {
            setRateError(err.response?.data?.error || "Failed to calculate rate");
        } finally {
            setIsCalculating(false);
        }
    };

    const loadRateCards = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params: Record<string, string> = {};
            if (filterCourier) params.courierName = filterCourier;
            if (filterAccount) params.accountType = filterAccount;
            const res = await adminApi.getRateCards(params);
            setRateCards(res.data?.rateCards || res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load rate cards");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRateCards();
    }, [filterCourier, filterAccount]);

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await adminApi.updateRateCard(editingId, form);
            } else {
                await adminApi.createRateCard(form);
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ accountType: "B2C", courierName: "DELHIVERY", marginType: "PERCENTAGE", marginValue: 15, minWeight: 0, maxWeight: 999 });
            loadRateCards();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to save rate card");
        }
    };

    const handleEdit = (card: RateCard) => {
        setForm({
            accountType: card.accountType,
            courierName: card.courierName,
            marginType: card.marginType,
            marginValue: card.marginValue,
            minWeight: card.minWeight || 0,
            maxWeight: card.maxWeight || 999,
        });
        setEditingId(card.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this rate card?")) return;
        try {
            await adminApi.deleteRateCard(id);
            loadRateCards();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to delete");
        }
    };

    if (isLoading) {
        return (
            <div className="dashboard loading-state">
                <div className="loading-spinner">Loading rate cards...</div>
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

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        background: "#fff",
    };

    return (
        <div className="dashboard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        💳 Rate Card Management
                    </h2>
                    <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
                        Configure margin rules per courier and account type
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setForm({ accountType: "B2C", courierName: "DELHIVERY", marginType: "PERCENTAGE", marginValue: 15, minWeight: 0, maxWeight: 999 });
                    }}
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
                    {showForm ? "Cancel" : "+ New Rate Card"}
                </button>
            </div>

            {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#0f172a" }}>
                        {editingId ? "Edit Rate Card" : "New Rate Card"}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Account Type</label>
                            <select
                                value={form.accountType}
                                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                                style={selectStyle}
                            >
                                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Courier</label>
                            <select
                                value={form.courierName}
                                onChange={(e) => setForm({ ...form, courierName: e.target.value })}
                                style={selectStyle}
                            >
                                {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Margin Type</label>
                            <select
                                value={form.marginType}
                                onChange={(e) => setForm({ ...form, marginType: e.target.value })}
                                style={selectStyle}
                            >
                                {MARGIN_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                                Margin Value {form.marginType === "PERCENTAGE" ? "(%)" : "(₹)"}
                            </label>
                            <input
                                type="number"
                                value={form.marginValue}
                                onChange={(e) => setForm({ ...form, marginValue: Number(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Min Weight (kg)</label>
                            <input
                                type="number"
                                value={form.minWeight}
                                onChange={(e) => setForm({ ...form, minWeight: Number(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Max Weight (kg)</label>
                            <input
                                type="number"
                                value={form.maxWeight}
                                onChange={(e) => setForm({ ...form, maxWeight: Number(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                        <button onClick={handleSubmit} style={{ padding: "8px 24px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                            {editingId ? "Update" : "Create"}
                        </button>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: "8px 24px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <select value={filterCourier} onChange={(e) => setFilterCourier(e.target.value)} style={{ ...selectStyle, width: 180 }}>
                    <option value="">All Couriers</option>
                    {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={{ ...selectStyle, width: 150 }}>
                    <option value="">All Types</option>
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Calculate Live Rate */}
            <div style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)", border: "1px solid #c7d2fe", borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#3730a3", marginBottom: 4 }}>
                    🔍 Calculate Live Delhivery Rate
                </h3>
                <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: 13 }}>
                    Get real-time shipping cost from Delhivery API
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Origin Pincode</label>
                        <input
                            type="text"
                            value={rateCalc.origin_pin}
                            onChange={(e) => setRateCalc({ ...rateCalc, origin_pin: e.target.value })}
                            placeholder="e.g. 110001"
                            maxLength={6}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Destination Pincode</label>
                        <input
                            type="text"
                            value={rateCalc.destination_pin}
                            onChange={(e) => setRateCalc({ ...rateCalc, destination_pin: e.target.value })}
                            placeholder="e.g. 400001"
                            maxLength={6}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Weight (grams)</label>
                        <input
                            type="number"
                            value={rateCalc.weight}
                            onChange={(e) => setRateCalc({ ...rateCalc, weight: Number(e.target.value) })}
                            min={1}
                            step={1}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>Payment Mode</label>
                        <select
                            value={rateCalc.payment_mode}
                            onChange={(e) => setRateCalc({ ...rateCalc, payment_mode: e.target.value as "Prepaid" | "COD" })}
                            style={selectStyle}
                        >
                            <option value="Prepaid">Prepaid</option>
                            <option value="COD">COD</option>
                        </select>
                    </div>
                    <button
                        onClick={handleCalculateRate}
                        disabled={isCalculating}
                        style={{
                            padding: "8px 20px",
                            borderRadius: 6,
                            border: "none",
                            background: isCalculating ? "#94a3b8" : "#4f46e5",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: isCalculating ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {isCalculating ? "Calculating..." : "Calculate"}
                    </button>
                </div>
                {rateCalc.payment_mode === "COD" && (
                    <div style={{ marginTop: 12, maxWidth: 200 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>COD Amount (₹)</label>
                        <input
                            type="number"
                            value={rateCalc.cod_amount}
                            onChange={(e) => setRateCalc({ ...rateCalc, cod_amount: Number(e.target.value) })}
                            style={inputStyle}
                        />
                    </div>
                )}
                {rateError && (
                    <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: 10, color: "#dc2626", fontSize: 13 }}>
                        {rateError}
                    </div>
                )}
                {rateResult && (
                    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                        {(() => {
                            // Delhivery returns nested data — extract the rate info
                            const charges = rateResult?.[0] || rateResult;
                            const totalAmount = charges?.total_amount || charges?.total || 0;
                            const freight = charges?.freight_charge || charges?.charge_amount || 0;
                            const codCharge = charges?.cod_charges || charges?.cod_amount || 0;
                            const zone = charges?.zone || charges?.pickup_zone || "-";
                            const chargedWeight = charges?.charged_weight || charges?.cgm || "-";
                            return (
                                <>
                                    <div style={{ background: "#fff", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Freight</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#059669" }}>₹{freight}</div>
                                    </div>
                                    <div style={{ background: "#fff", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>COD Charge</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#d97706" }}>₹{codCharge}</div>
                                    </div>
                                    <div style={{ background: "#fff", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Total</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#4f46e5" }}>₹{totalAmount}</div>
                                    </div>
                                    <div style={{ background: "#fff", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Zone</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{zone}</div>
                                    </div>
                                    <div style={{ background: "#fff", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Charged Weight</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{chargedWeight}g</div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Table */}
            <section className="recent-activity-card">
                <div className="table-responsive">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Account Type</th>
                                <th>Courier</th>
                                <th>Margin Type</th>
                                <th>Margin Value</th>
                                <th>Weight Range</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rateCards.length > 0 ? (
                                rateCards.map((card) => (
                                    <tr key={card.id}>
                                        <td>
                                            <span className={`status-badge ${card.accountType === "B2C" ? "pending" : "completed"}`}>
                                                {card.accountType}
                                            </span>
                                        </td>
                                        <td className="fw-medium">{card.courierName}</td>
                                        <td>{card.marginType}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {card.marginType === "PERCENTAGE" ? `${card.marginValue}%` : `₹${card.marginValue}`}
                                        </td>
                                        <td>{card.minWeight ?? 0} – {card.maxWeight ?? "∞"} kg</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button onClick={() => handleEdit(card)} style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid #cbd5e1", background: "#fff", color: "#4f46e5", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(card.id)} style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="no-data-cell">
                                        No rate cards configured. Click "+ New Rate Card" to add one.
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
