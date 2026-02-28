import { Outlet, Navigate } from "react-router-dom";
import SupportSidebar from "./SupportSidebar";
import "../admin/AdminLayout.css";
import { useAuth } from "@/lib/auth";

export default function SupportLayout() {
    const { user, token } = useAuth();

    // Redirect if not logged in
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Only allow SUPPORT or ADMIN users
    if (user.role !== "SUPPORT" && user.role !== "ADMIN") {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="admin-root">
            <header className="topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    🎧 Support Panel
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                    Logged in as <strong>{user.name || user.email}</strong>
                </div>
            </header>
            <div className="admin-body">
                <SupportSidebar />
                <div className="admin-main-area">
                    <div className="admin-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
