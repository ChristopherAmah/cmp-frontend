import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-datepicker/dist/react-datepicker.css";


const StyledDatePicker = forwardRef(
  (
    {
      className,
      placeholder = "Select date",
      dateFormat = "yyyy-MM-dd",
      showClearButton = true,
      isClearable: isClearableProp = true,
      ...props
    },
    ref
  ) => {
    
    const isClearable = isClearableProp && showClearButton;
    return (
      <div className="relative">
        <DatePicker
          ref={ref}
          dateFormat={dateFormat}
          isClearable={isClearable}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-background py-2 text-sm text-foreground",
            "pl-10 pr-10", // Left for calendar icon, right for clear button
            "ring-offset-background placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2 focus:border-primary/60",
            "hover:border-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            className
          )}
          placeholderText={placeholder}
          {...props}
        />
        {/* Calendar Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Clear Button (styled separately) */}
        {showClearButton && isClearable && props.selected && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (props.onChange) {
                props.onChange(null, e);
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-1 z-10"
            aria-label="Clear date selection"
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    );
  }
);

StyledDatePicker.displayName = "StyledDatePicker";

export { StyledDatePicker };
export default StyledDatePicker;
