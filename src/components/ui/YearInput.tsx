import * as React from "react";
import { Input, InputProps } from "./input";
import { cn } from "@/lib/utils";

export interface YearInputProps extends Omit<InputProps, "onChange"> {
  value?: number | string;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
}

const YearInput = React.forwardRef<HTMLInputElement, YearInputProps>(
  ({ className, value, onChange, min, max, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Allow empty input
      if (val === "") {
        onChange(undefined);
        return;
      }
      // Only allow up to 4 digits
      if (/^\d{0,4}$/.test(val)) {
        onChange(parseInt(val, 10));
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let numValue = value ? Number(value) : undefined;

      if (numValue !== undefined) {
        if (min && numValue < min) numValue = min;
        if (max && numValue > max) numValue = max;
        if (numValue !== Number(value)) {
          onChange(numValue);
        }
      }
      props.onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text" // Use text to allow controlled input format
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn("w-28", className)}
        {...props}
      />
    );
  }
);
YearInput.displayName = "YearInput";

export { YearInput };
