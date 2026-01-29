import { NavLink } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">Admin Panel</div>
      <nav>
        <ul>
          <li>
            <NavLink to="/dashboard">📊 Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/users">👤 Users</NavLink>
          </li>
          <li>
            <NavLink to="/vendors">🏪 Vendors</NavLink>
          </li>
          <li>
            <NavLink to="/services">📦 Services</NavLink>
          </li>
          <li>
            <NavLink to="/orders">🧾 Orders</NavLink>
          </li>
          <li>
            <NavLink to="/payments">💰 Payments</NavLink>
          </li>
          <li>
            <NavLink to="/analytics">📈 Analytics</NavLink>
          </li>
          <li>
            <NavLink to="/settings">🛠 Settings</NavLink>
          </li>
          <li>
            <NavLink to="/logout">🚪 Logout</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
