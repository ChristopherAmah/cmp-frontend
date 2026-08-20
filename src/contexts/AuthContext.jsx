import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AUTH_DEBUG = true; // Enable debugging to troubleshoot login issue
const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";
const DEV_USER = {
  _id: "ui-development-user",
  id: "ui-development-user",
  name: "UI Developer",
  email: "ui-developer@local.test",
  role: "super_admin",
  mustChangePassword: false,
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false - check token first
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      setUser(DEV_USER);
      setIsAuthenticated(true);
      return;
    }

    // Always ask backend who the current user is; backend uses httpOnly cookie for auth
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (DEV_AUTH_BYPASS) {
      setUser(DEV_USER);
      setIsAuthenticated(true);
      return;
    }

    setLoading(true);
    try {
      if (AUTH_DEBUG) console.log("[AuthContext] Checking authentication...");
      const response = await authService.getMe();
      if (AUTH_DEBUG) console.log("[AuthContext] Auth response:", response);
      if (response.status === "success" && response.data?.user) {
        // Normalize user data
        const userData = response.data.user;
        const normalizedUser = {
          ...userData,
          _id: userData._id || userData.id,
        };
        setUser(normalizedUser);
        setIsAuthenticated(true);
        if (AUTH_DEBUG)
          console.log("[AuthContext] User authenticated:", normalizedUser);
      } else {
        // Invalid token - clear it
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
        if (AUTH_DEBUG) console.log("[AuthContext] Not authenticated");
      }
    } catch (error) {
      // Auth failed - clear token
      localStorage.removeItem("token");
      if (AUTH_DEBUG) {
        console.log(
          "[AuthContext] Auth check failed (expected if not logged in):",
          error.message,
        );
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      if (AUTH_DEBUG)
        console.log("[AuthContext] Auth check complete, loading set to false");
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (AUTH_DEBUG) console.log("[AuthContext] Login response:", response);

      if (response.status === "success") {
        // Handle response structure: response.data.user or response.data.data.user
        const userData =
          response.data?.user || response.data?.data?.user || response.user;

        if (userData) {
          // Ensure user object has _id for consistency
          const normalizedUser = {
            ...userData,
            _id: userData._id || userData.id,
          };

          // Persist JWT token for Authorization header as a fallback to cookies
          const token =
            response.data?.token || response.data?.data?.token || null;
          if (token) {
            localStorage.setItem("token", token);
          }

          setUser(normalizedUser);
          setIsAuthenticated(true);

          if (AUTH_DEBUG)
            console.log("[AuthContext] User authenticated:", normalizedUser);

          // Return success after state is set
          return { success: true, user: normalizedUser };
        } else {
          if (AUTH_DEBUG) console.log("[AuthContext] No user data in response");
          return { success: false, message: "Invalid response format" };
        }
      }
      return { success: false, message: response.message || "Login failed" };
    } catch (error) {
      if (AUTH_DEBUG) console.error("[AuthContext] Login error:", error);

      // Handle network errors
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("CONNECTION_REFUSED")
      ) {
        return {
          success: false,
          message:
            "Cannot connect to server. Please make sure the backend server is running on port 5001.",
        };
      }

      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    if (DEV_AUTH_BYPASS) return;

    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update user data locally without API call (for immediate UI updates)
  const updateUser = (userData) => {
    setUser((prev) => ({
      ...prev,
      ...userData,
      _id: userData._id || userData.id || prev?._id,
    }));
    if (AUTH_DEBUG)
      console.log("[AuthContext] User updated locally:", userData);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    updateUser,
  };

  // Don't show loading spinner - let the app render immediately
  // The ProtectedRoute will handle redirecting to login if needed
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
