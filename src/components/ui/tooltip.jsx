import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// Configure tooltip delay for smoother appearance
const TooltipProvider = ({ children, ...props }) => (
  <TooltipPrimitive.Provider
    delayDuration={300} // Delay before showing tooltip (prevents abrupt appearance)
    skipDelayDuration={0} // No delay when moving between tooltips
    {...props}
  >
    {children}
  </TooltipPrimitive.Provider>
);

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(
  ({ className, sideOffset = 6, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs rounded-md border border-border/50 bg-background/95 backdrop-blur-md px-2.5 py-1.5 text-xs font-normal text-foreground/90 shadow-lg",
        // Smooth entrance animation with fade and subtle scale
        "animate-in fade-in-0 zoom-in-95 duration-200 ease-out",
        // Smooth exit animation
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150 data-[state=closed]:ease-in",
        // Very subtle directional slide for polished feel
        "data-[side=bottom]:slide-in-from-top-0.5",
        "data-[side=left]:slide-in-from-right-0.5",
        "data-[side=right]:slide-in-from-left-0.5",
        "data-[side=top]:slide-in-from-bottom-0.5",
        className
      )}
      style={{
        backgroundColor: "hsl(var(--background) / 0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        // Smooth transitions with premium easing curve
        transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        // Ensure transform origin is centered for smooth scale animation
        transformOrigin: "var(--radix-tooltip-content-transform-origin)",
      }}
      {...props}
    />
  )
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
