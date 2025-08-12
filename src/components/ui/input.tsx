import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          // Mobile style: taller, no border, gray bg for an inset look
          "flex h-11 w-full min-w-0 rounded-lg border-none bg-secondary px-4 py-2 text-base outline-none",
          // Desktop style: standard height, border, transparent bg
          "md:h-9 md:rounded-md md:border md:border-input md:bg-transparent",
          "transition-[color,box-shadow,background-color,border-color]",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Focus and invalid states
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 md:focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          // Dark mode overrides
          "dark:bg-secondary dark:md:bg-input/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };