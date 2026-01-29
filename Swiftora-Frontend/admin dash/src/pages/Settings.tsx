import "./Pages.css";

export default function Settings() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-section">
        <h3>General Settings</h3>
        <div className="form-group">
          <label>Platform Name</label>
          <input
            type="text"
            className="form-input"
            defaultValue="Swiftora Admin"
          />
        </div>
        <div className="form-group">
          <label>Support Email</label>
          <input
            type="email"
            className="form-input"
            defaultValue="support@swiftora.com"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Financial Settings</h3>
        <div className="form-group">
          <label>Default Commission (%)</label>
          <input type="number" className="form-input" defaultValue="10" />
        </div>
        <div className="form-group">
          <label>GST / Tax Rate (%)</label>
          <input type="number" className="form-input" defaultValue="18" />
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

      <div className="form-actions">
        <button className="action-btn btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
