import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  Plug,
  Settings,
  LogOut,
  Truck,
  Ticket,
} from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/vendors", icon: Store, label: "Vendors" },
    { to: "/admin/services", icon: Truck, label: "Services" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/admin/tickets", icon: Ticket, label: "Tickets" },
    { to: "/admin/payments", icon: CreditCard, label: "Payments" },
  ];

  const settingsItems = [
    { to: "/admin/integrations", icon: Plug, label: "Integrations" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <Package size={28} />
        <span>Swiftora Admin</span>
      </div>
      
      <nav>
        <div className="nav-label">Main Menu</div>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-section">
          <div className="nav-label">Settings</div>
          <ul>
            {settingsItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/" className="exit-link">
                <LogOut size={20} />
                <span>Exit Admin</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
