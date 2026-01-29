import { useState, useEffect } from "react";
import "./Pages.css";

interface Integration {
    name: string;
    status: "connected" | "disconnected";
    description: string;
    icon: string;
}

export default function Integrations() {
    const [delhiveryConnected, setDelhiveryConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const integrations: Integration[] = [
        {
            name: "Delhivery",
            status: delhiveryConnected ? "connected" : "disconnected",
            description: "Primary courier partner for all shipments",
            icon: "🚚",
        },
        {
            name: "Shiprocket",
            status: "disconnected",
            description: "Coming soon - Multi-courier aggregator",
            icon: "🚀",
        },
        {
            name: "Shopify",
            status: "disconnected",
            description: "Coming soon - E-commerce platform integration",
            icon: "🛒",
        },
        {
            name: "WooCommerce",
            status: "disconnected",
            description: "Coming soon - WordPress e-commerce integration",
            icon: "📦",
        },
    ];

    useEffect(() => {
        // Check if Delhivery is configured by testing the API
        const checkStatus = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://server-liard-nu.vercel.app';
                const response = await fetch(`${apiUrl}/api/test-delhivery`);
                const data = await response.json();
                setDelhiveryConnected(data.connected || false);
            } catch (error) {
                // If endpoint fails, assume not connected
                setDelhiveryConnected(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>🔌 Integrations</h2>
                <span className="user-count">Admin Only</span>
            </div>

            <div className="section-card" style={{ marginBottom: "1.5rem" }}>
                <div className="alert-info">
                    <strong>⚠️ Single Account Architecture</strong>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#1e40af" }}>
                        All users on this platform use the centralized Delhivery account configured via environment variables.
                        To connect Delhivery, set <code>DELHIVERY_API_KEY</code> in your server environment.
                    </p>
                </div>
            </div>

            <div className="section-card" style={{ marginBottom: "1.5rem", background: "#f8fafc" }}>
                <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>🔧 Configuration Instructions</h3>
                <ol style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "0.9rem", lineHeight: "1.8" }}>
                    <li>Get your Delhivery API key from <a href="https://one.delhivery.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Delhivery One Dashboard</a></li>
                    <li>Add <code>DELHIVERY_API_KEY=your_api_key_here</code> to your Vercel environment variables</li>
                    <li>Redeploy the backend to apply changes</li>
                    <li>All orders created by users will automatically use this API key</li>
                </ol>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>Loading integration status...</div>
            ) : (
                <div className="integrations-grid">
                    {integrations.map((integration, index) => (
                        <div key={index} className={`integration-card ${integration.status}`}>
                            <div className="integration-header">
                                <span className="integration-icon">{integration.icon}</span>
                                <div className="integration-info">
                                    <h3>{integration.name}</h3>
                                    <p>{integration.description}</p>
                                </div>
                                <span className={`status-badge ${integration.status === "connected" ? "active" : "inactive"}`}>
                                    {integration.status === "connected" ? "Connected" : "Not Connected"}
                                </span>
                            </div>

                            {integration.name === "Delhivery" && (
                                <div className="integration-actions">
                                    {delhiveryConnected ? (
                                        <div className="connected-actions">
                                            <span style={{ color: "#16a34a", fontSize: "0.9rem" }}>
                                                ✅ API Key configured via environment variable
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                                            ❌ DELHIVERY_API_KEY not set in environment variables
                                        </div>
                                    )}
                                </div>
                            )}

                            {integration.name !== "Delhivery" && (
                                <div className="integration-actions">
                                    <span className="coming-soon">Coming Soon</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
