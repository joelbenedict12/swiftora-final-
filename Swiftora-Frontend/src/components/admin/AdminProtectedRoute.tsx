import { Navigate, useLocation } from "react-router-dom";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";

    if (!isAuthenticated) {
        // Redirect to admin login, saving the intended destination
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
