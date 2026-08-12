import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef(
  ({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full",
        "bg-[#4BB7DA] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* X Icon */}
      <div className="absolute left-2 flex items-center justify-center">
        <X
          size={14}
          strokeWidth={2.5}
          className="text-white"
        />
      </div>

      {/* Thumb */}
      <SwitchPrimitives.Thumb
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200",
          "data-[state=unchecked]:translate-x-[2px]",
          "data-[state=checked]:translate-x-[26px]"
        )}
      >
        <Check
          size={14}
          strokeWidth={2.5}
          className="text-[#4BB7DA]"
        />
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
);

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };