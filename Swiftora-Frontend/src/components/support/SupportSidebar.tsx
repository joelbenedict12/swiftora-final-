import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Ticket,
    LogOut,
    HeadphonesIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SupportSidebar() {
    const { logout, user } = useAuth();

    const navItems = [
        { to: "/support", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/support/tickets", icon: Ticket, label: "My Tickets" },
    ];

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    return (
        <aside className="sidebar">
            <div className="logo">
                <HeadphonesIcon size={28} />
                <span>Swiftora Support</span>
            </div>

            <nav>
                <div className="nav-label">Support Menu</div>
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
                    <div className="nav-label">Account</div>
                    <ul>
                        <li>
                            <div className="sidebar-user-info" style={{ padding: "8px 16px", color: "#94a3b8", fontSize: "0.85em" }}>
                                {user?.name || user?.email}
                            </div>
                        </li>
                        <li>
                            <a href="#" className="exit-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                <LogOut size={20} />
                                <span>Logout</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        </aside>
    );
}
