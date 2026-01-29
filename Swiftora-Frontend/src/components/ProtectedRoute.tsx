import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string[];
}

export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
    const { user, token, checkSession, _hasHydrated } = useAuth();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const verify = async () => {
            // Wait for hydration to complete
            if (!_hasHydrated) {
                return;
            }

            if (token && !user) {
                // Token exists but user not loaded, verify session
                try {
                    await checkSession();
                } catch (error) {
                    console.error('Session verification failed:', error);
                }
            }
            setIsChecking(false);
        };

        verify();
    }, [token, user, checkSession, _hasHydrated]);

    // Show loading state while hydrating or checking
    if (!_hasHydrated || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Verifying session...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role)) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
                        <p className="text-muted-foreground">
                            You don't have permission to access this page.
                        </p>
                    </div>
                </div>
            );
        }
    }

    // User is authenticated and authorized
    return <>{children}</>;
};
