import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const chipVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        selectable:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-6 px-2.5 text-xs",
        md: "h-8 px-4",
        lg: "h-10 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  selected?: boolean;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, size, children, onRemove, selected, ...props }, ref) => {
    const isSelectable = variant === "selectable";
    const Component = isSelectable ? "button" : "div";

    return (
      <Component
        className={cn(chipVariants({ variant, size, className }))}
        ref={ref as any}
        data-selected={selected}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent chip click event if inside one
              onRemove();
            }}
            className="ml-2 -mr-1 flex-shrink-0 rounded-full opacity-50 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Remove</span>
          </button>
        )}
      </Component>
    );
  },
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
