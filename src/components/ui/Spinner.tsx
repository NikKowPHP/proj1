import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current border-r-transparent border-t-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-[1.5px]",
        md: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-[3px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = ({ className, size, ...props }: SpinnerProps) => {
  return (
    <div role="status">
      <div className={cn(spinnerVariants({ size, className }))} {...props} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
