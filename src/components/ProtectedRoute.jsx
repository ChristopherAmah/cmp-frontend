import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // If loading (checking token), show nothing - will redirect once check completes
  if (loading) {
    return null;
  }

  // If not authenticated or no user, redirect to login immediately
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Render children only if authenticated
  return children;
};

export default ProtectedRoute;
