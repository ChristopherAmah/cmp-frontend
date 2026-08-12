import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] hover:-translate-y-0.5",
        outline:
          "border border-border bg-background hover:bg-secondary hover:border-muted-foreground/30 active:scale-[0.97]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted active:scale-[0.97]",
        ghost:
          "hover:bg-secondary hover:text-foreground active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-white shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] hover:-translate-y-0.5",
        warning:
          "bg-warning text-white shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] hover:-translate-y-0.5",
        info: "bg-info text-white shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] hover:-translate-y-0.5",
        gradient:
          "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md hover:shadow-lg active:scale-[0.97] hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 sm:h-10 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-base sm:text-sm",
        sm: "h-10 sm:h-9 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm sm:text-xs",
        lg: "h-12 sm:h-11 px-6 py-3 sm:py-2.5 min-h-[48px] sm:min-h-0 text-base",
        xl: "h-14 sm:h-12 px-8 py-3.5 sm:py-3 min-h-[56px] sm:min-h-0 text-lg sm:text-base",
        icon: "h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
        "icon-sm": "h-10 w-10 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
        "icon-lg": "h-12 w-12 sm:h-12 sm:w-12 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
