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
          "file:text-foreground placeholder:text-muted-foreground selection:bg-[#3a3a3c] selection:text-[#3a3a3c]",
          "flex h-11 w-full rounded-lg border-none bg-[#3a3a3c] px-4 py-2 text-base outline-none",
          "transition-[color,box-shadow,background-color,border-color]",
          "file:inline-flex file:h-7 file:border-0 file:bg-[#3a3a3c] file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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
      