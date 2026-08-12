import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex w-full rounded-lg border border-border bg-background text-foreground ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:border-primary/60",
        "hover:border-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all duration-200",
        // Mobile-first: larger tap targets and font size
        "h-11 sm:h-10 px-3 sm:px-3 py-2.5 sm:py-2 text-base sm:text-sm",
        // Prevent zoom on iOS
        "text-base sm:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
