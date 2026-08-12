import { useEffect, useState, useContext } from "react";
import { createPortal } from "react-dom";
import { Toast } from "./toast";
import { useNotificationManager } from "@/contexts/NotificationManager";

export function Toaster() {
  const { toasts, removeToast } = useNotificationManager();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Only render if there are toasts
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-3 sm:p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 sm:gap-3"
      style={{ pointerEvents: "none" }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full"
          style={{ pointerEvents: "auto" }}
        >
          <Toast
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}
