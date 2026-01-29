import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

// Admin credentials (in production, this should be on the backend)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "nthspacesolutions";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Simple validation
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Store admin session
            sessionStorage.setItem("admin_authenticated", "true");
            sessionStorage.setItem("admin_login_time", Date.now().toString());
            navigate("/admin");
        } else {
            setError("Invalid username or password");
        }
        setIsLoading(false);
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <h1>🔐 Admin Portal</h1>
                    <p>Enter your credentials to access the admin dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {error && <div className="admin-login-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button type="submit" className="admin-login-btn" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <a href="/">← Back to Swiftora</a>
                </div>
            </div>
        </div>
    );
}
