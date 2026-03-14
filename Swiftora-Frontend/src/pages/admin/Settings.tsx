import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import "./Pages.css";

export default function Settings() {
  const [commission, setCommission] = useState("");
  const [minRecharge, setMinRecharge] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [qcCharge, setQcCharge] = useState("15");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getSettings();
        const s = res.data;
        setCommission(s.platform_commission_percent || "15");
        setMinRecharge(s.min_recharge_amount || "500");
        setQrUrl(s.platform_qr_url || "");
        setQcCharge(s.qc_charge || "15");
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      await adminApi.updateSettings({
        platform_commission_percent: Number(commission),
        min_recharge_amount: Number(minRecharge),
        platform_qr_url: qrUrl,
        qc_charge: Number(qcCharge),
      });
      setMessage("Settings saved successfully!");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-section">
        <h3>Financial Settings</h3>
        <div className="form-group">
          <label>Platform Commission (%)</label>
          <input
            type="number"
            className="form-input"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            min="0"
            max="100"
            step="0.5"
          />
          <small style={{ color: "#666" }}>
            Applied as markup on all courier costs — also reflected on seller rate cards
          </small>
          {Number(commission) > 0 && (
            <div style={{
              marginTop: 10,
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              fontSize: 13,
              color: "#166534",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>Commission Rate:</span>{" "}
                {Number(commission)}%
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>On ₹100 courier cost:</span>{" "}
                ₹{(100 * Number(commission) / 100).toFixed(2)} commission → ₹{(100 + 100 * Number(commission) / 100).toFixed(2)} vendor charge
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>On ₹500 courier cost:</span>{" "}
                ₹{(500 * Number(commission) / 100).toFixed(2)} commission → ₹{(500 + 500 * Number(commission) / 100).toFixed(2)} vendor charge
              </div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Minimum Wallet Recharge (₹)</label>
          <input
            type="number"
            className="form-input"
            value={minRecharge}
            onChange={(e) => setMinRecharge(e.target.value)}
            min="0"
            step="100"
          />
          <small style={{ color: "#666" }}>
            Vendors must recharge at least this amount
          </small>
        </div>
        <div className="form-group">
          <label>QC Charge (₹) — Reverse Pickup</label>
          <input
            type="number"
            className="form-input"
            value={qcCharge}
            onChange={(e) => setQcCharge(e.target.value)}
            min="0"
            max="100"
            step="1"
          />
          <small style={{ color: "#666" }}>
            Quality check charge applied when QC is enabled for reverse pickups (₹0–100)
          </small>
        </div>
      </div>

      <div className="settings-section">
        <h3>Payment QR Code</h3>
        <div className="form-group">
          <label>QR Code Image URL</label>
          <input
            type="text"
            className="form-input"
            value={qrUrl}
            onChange={(e) => setQrUrl(e.target.value)}
            placeholder="https://example.com/your-qr-code.png"
          />
          <small style={{ color: "#666" }}>
            Upload your UPI QR code image somewhere and paste the URL here.
            Vendors will see this QR on the Billing page for manual payments.
          </small>
        </div>
        {qrUrl && (
          <div style={{ marginTop: 12 }}>
            <label>Preview:</label>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "inline-block", marginTop: 4 }}>
              <img src={qrUrl} alt="QR Preview" style={{ width: 160, height: 160, objectFit: "contain" }} />
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>General Settings</h3>
        <div className="form-group">
          <label>Platform Name</label>
          <input type="text" className="form-input" defaultValue="Swiftora Admin" />
        </div>
        <div className="form-group">
          <label>Support Email</label>
          <input type="email" className="form-input" defaultValue="support@swiftora.com" />
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="form-group toggle-switch">
          <input type="checkbox" id="notif-orders" defaultChecked />
          <label htmlFor="notif-orders">New Order Alerts</label>
        </div>
        <div className="form-group toggle-switch">
          <input type="checkbox" id="notif-vendors" defaultChecked />
          <label htmlFor="notif-vendors">Vendor Registration Alerts</label>
        </div>
        <div className="form-group toggle-switch">
          <input type="checkbox" id="notif-payouts" />
          <label htmlFor="notif-payouts">Payout Processed Alerts</label>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "10px 16px",
          borderRadius: 6,
          marginBottom: 12,
          background: message.includes("success") ? "#d4edda" : "#f8d7da",
          color: message.includes("success") ? "#155724" : "#721c24",
        }}>
          {message}
        </div>
      )}

      <div style={{
        position: "sticky",
        bottom: 0,
        background: "linear-gradient(transparent, #f8fafc 20%)",
        padding: "24px 0 16px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        zIndex: 10,
      }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: "12px 32px",
            fontSize: "15px",
            fontWeight: 600,
            color: "#fff",
            background: isSaving ? "#94a3b8" : "#6366f1",
            border: "none",
            borderRadius: "8px",
            cursor: isSaving ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            transition: "all 0.2s",
          }}
        >
          {isSaving ? "Saving..." : "💾 Save Changes"}
        </button>
      </div>
    </div>
  );
}
