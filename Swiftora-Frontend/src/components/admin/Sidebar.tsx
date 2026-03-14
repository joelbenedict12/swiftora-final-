import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  CreditCard,
  Plug,
  Settings,
  LogOut,
  Ticket,
  BarChart3,
  Wallet,
  FileText,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/vendors", icon: Store, label: "Vendors" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/admin/tickets", icon: Ticket, label: "Tickets" },
    { to: "/admin/payments", icon: CreditCard, label: "Payments" },
    { to: "/admin/cod-remittance", icon: Wallet, label: "COD Remittance" },
    { to: "/admin/ndr-cases", icon: AlertTriangle, label: "NDR Cases" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/admin/rate-cards", icon: Wallet, label: "Rate Cards" },
    { to: "/admin/invoices", icon: FileText, label: "Invoices" },
  ];

  const settingsItems = [
    { to: "/admin/integrations", icon: Plug, label: "Integrations" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

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
              <a href="#" className="exit-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <LogOut size={20} />
                <span>Exit Admin</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
