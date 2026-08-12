import * as React from "react";
import { cva } from "class-variance-authority";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border shadow-lg transition-all animate-slide-up min-w-[320px] max-w-[420px]",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground p-4 pr-10",
        success:
          "border-green-700/30 dark:border-green-600/40 bg-green-600 dark:bg-green-700 text-white p-4 pr-10",
        destructive:
          "border-red-700/30 dark:border-red-600/40 bg-red-600 dark:bg-red-700 text-white p-4 pr-10",
        warning:
          "border-amber-700/30 dark:border-amber-600/40 bg-amber-600 dark:bg-amber-700 text-white p-4 pr-10",
        critical:
          "border-purple-700/30 dark:border-purple-600/40 bg-purple-600 dark:bg-purple-700 text-white p-4 pr-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(
  ({ className, variant, title, description, onClose, ...props }, ref) => {
    const Icon = React.useMemo(() => {
      switch (variant) {
        case "success":
          return CheckCircle2;
        case "destructive":
          return AlertCircle;
        case "warning":
          return AlertTriangle;
        case "critical":
          return AlertTriangle;
        default:
          return Info;
      }
    }, [variant]);

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1 min-w-0">
            {title && (
              <div className="text-sm font-semibold leading-tight">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm leading-relaxed opacity-95">{description}</div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent group-hover:opacity-100 z-10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast, toastVariants };
