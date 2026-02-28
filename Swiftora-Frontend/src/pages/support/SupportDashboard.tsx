import { useState, useEffect } from "react";
import { supportApi } from "@/lib/api";
import "../admin/Pages.css";
import "../admin/Dashboard.css";

export default function SupportDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setIsLoading(true);
                const response = await supportApi.getDashboardStats();
                setStats(response.data);
            } catch (error) {
                console.error("Failed to load support stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="page-container">
                <div className="loading-state">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>🎧 Support Dashboard</h2>
                <p className="page-description">Overview of your assigned tickets</p>
            </div>

            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <div className="stat-card" style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Open Tickets</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>{stats?.openTickets || 0}</div>
                </div>
                <div className="stat-card" style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem" }}>In Progress</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#3b82f6" }}>{stats?.inProgressTickets || 0}</div>
                </div>
                <div className="stat-card" style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Resolved Today</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#22c55e" }}>{stats?.resolvedToday || 0}</div>
                </div>
                <div className="stat-card" style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Total Assigned</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#6366f1" }}>{stats?.totalAssigned || 0}</div>
                </div>
            </div>
        </div>
    );
}
