import * as React from "react";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getYear,
  getMonth,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Calendar({ className, selected, onSelect }) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());

  React.useEffect(() => {
    if (selected) {
      setCurrentDate(selected);
    }
  }, [selected]);

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(currentDate);
    const day = newDate.getDate();
    newDate.setMonth(Number(monthIndex));
    // Handle month overflow (e.g., Jan 31 -> Feb becomes Mar 3)
    // If the day doesn't exist in the new month, set to last day of that month
    if (newDate.getMonth() !== Number(monthIndex)) {
      newDate.setDate(0); // Go to last day of previous month (which is the last day of target month)
    }
    setCurrentDate(newDate);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(currentDate);
    const day = newDate.getDate();
    const month = newDate.getMonth();
    newDate.setFullYear(Number(year));
    // Handle leap year edge case (Feb 29 -> Feb 28 in non-leap years)
    if (newDate.getMonth() !== month) {
      newDate.setDate(0); // Go to last day of previous month
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (day) => {
    setCurrentDate(day);
    onSelect?.(day);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from(
    { length: firstDayOfWeek },
    () => null
  );

  return (
    <div className={cn("p-3", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Select
            value={String(getMonth(currentDate))}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger 
              className="w-[140px] h-9 text-sm font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              onPointerDownOutside={(e) => {
                // Prevent closing calendar when clicking Select dropdown
                e.preventDefault();
              }}
              onInteractOutside={(e) => {
                // Prevent closing calendar when interacting with Select
                e.preventDefault();
              }}
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((month, index) => (
                <SelectItem key={index} value={String(index)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(getYear(currentDate))}
            onValueChange={handleYearChange}
          >
            <SelectTrigger 
              className="w-[100px] h-9 text-sm font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              className="max-h-[200px] overflow-y-auto"
              onPointerDownOutside={(e) => {
                // Prevent closing calendar when clicking Select dropdown
                e.preventDefault();
              }}
              onInteractOutside={(e) => {
                // Prevent closing calendar when interacting with Select
                e.preventDefault();
              }}
            >
              {Array.from({ length: 101 }, (_, i) => {
                const year = new Date().getFullYear() - 50 + i;
                return (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {[...daysBeforeMonth, ...days].map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-9" />;
            }

            const isSelected = selected && isSameDay(day, selected);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                className={cn(
                  "h-9 w-9 rounded-md text-sm font-medium transition-all duration-200",
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md scale-105 font-semibold"
                    : isToday
                    ? "bg-secondary text-foreground font-semibold ring-2 ring-primary/30"
                    : "hover:bg-secondary text-foreground hover:scale-105"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const datePickerRef = React.useRef(null);

  // Parse the date value
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      try {
        return parse(value, "yyyy-MM-dd", new Date());
      } catch {
        return new Date(value);
      }
    }
    return undefined;
  }, [value]);

  const handleSelect = (date) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  // Close on outside click and escape key
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!datePickerRef.current) return;
      
      const target = event.target;
      
      // Check if click is inside the date picker container
      if (datePickerRef.current.contains(target)) {
        return;
      }
      
      // Check if click is inside a Radix Select portal (month/year dropdowns)
      // Radix portals are typically rendered in body, so check for Select-related elements
      const isSelectElement = target.closest('[role="listbox"]') || 
                             target.closest('[data-radix-select-content]') ||
                             target.closest('[data-radix-select-viewport]') ||
                             target.closest('[data-radix-select-item]') ||
                             target.getAttribute('role') === 'option';
      
      if (isSelectElement) {
        return; // Don't close if clicking on Select dropdown
      }
      
      // Also check if any Select is currently open
      const selectContent = document.querySelector('[data-radix-select-content][data-state="open"]');
      if (selectContent && selectContent.contains(target)) {
        return;
      }
      
      // Close the calendar
      setIsOpen(false);
    };

    const handleEscape = (e) => {
      // Only close on Escape if Select dropdowns are not open
      const selectOpen = document.querySelector('[data-radix-select-content][data-state="open"]');
      if (!selectOpen && e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use capture phase to catch events before they bubble
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={datePickerRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-10 border-border rounded-lg bg-background hover:bg-secondary transition-colors",
          !dateValue && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">
          {dateValue ? (
            format(dateValue, "PPP")
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute z-50 mt-2 bg-card border border-border rounded-xl shadow-lg p-4 min-w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar selected={dateValue} onSelect={handleSelect} />
          </div>
        </>
      )}
    </div>
  );
}
