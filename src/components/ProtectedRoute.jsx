import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // If loading (checking token), show nothing - will redirect once check completes
  if (loading) {
    return null;
  }

  // If not authenticated or no user, redirect to login immediately
  if (!isAuthenticated || !user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/support" replace />;
  }

  // Render children only if authenticated
  return children;
};

export default ProtectedRoute;
