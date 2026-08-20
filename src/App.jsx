import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { NotificationManagerProvider, useNotificationManager } from "./contexts/NotificationManager";
import { Toaster } from "./components/ui/toaster";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import PasswordSetup from "./pages/PasswordSetup";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import OrganizationDetail from "./pages/OrganizationDetail";
import Profile from "./pages/Profile";
import AllDocuments from "./pages/AllDocuments";
import Invoices from "./pages/Invoices";
import ContractsV3 from "./pages/ContractsV3";
import ContractDetailV3 from "./pages/ContractDetailV3";
import CreateContract from "./pages/CreateContract";
import InvoiceDetail from "./pages/InvoiceDetail";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import ErrorBoundary from "./components/ErrorBoundary";

// Component to clear notifications on navigation
// Note: We don't clear toasts on navigation anymore to allow them to display
// Users can dismiss them manually if needed
function NotificationNavigationHandler() {
  // Removed automatic toast clearing on navigation
  // This allows toasts to display properly even after navigation
  return null;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="cmp-ui-theme">
        <NotificationManagerProvider>
          <Router>
          <NotificationNavigationHandler />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<PasswordSetup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <ProtectedRoute>
                  <Organizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organization/:id"
              element={
                <ProtectedRoute>
                  <OrganizationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/documents"
              element={
                <ProtectedRoute>
                  <AllDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Invoices />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ContractsV3 />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/new"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <CreateContract />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ContractDetailV3 />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <InvoiceDetail />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Users />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AuditLogs />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Support />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Notifications />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </NotificationManagerProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
