// Backward compatibility wrapper - use NotificationManager internally
import { useContext } from "react";
import { NotificationManagerContext } from "../contexts/NotificationManager";

// Legacy ToastContext for backward compatibility
export const ToastContext = NotificationManagerContext;

// Legacy ToastProvider - now just a pass-through
// NotificationManagerProvider should be used instead
export const ToastProvider = ({ children }) => {
  // This is a no-op - NotificationManagerProvider should be used instead
  return children;
};

export const useToast = () => {
  const context = useContext(NotificationManagerContext);
  if (!context) {
    // Fallback for components that use toast before provider is set up
    return {
      toast: ({ title, description, variant = "default" }) => {
        console.log(`[Toast] ${title}: ${description}`);
      },
      toasts: [],
      removeToast: () => {},
      clearAllToasts: () => {},
    };
  }
  
  // Map NotificationManager API to legacy toast API
  return {
    toast: ({ title, description, variant = "default" }) => {
      context.showNotification({ title, description, variant });
    },
    toasts: context.toasts,
    removeToast: context.removeToast,
    clearAllToasts: context.clearAllToasts,
  };
};
