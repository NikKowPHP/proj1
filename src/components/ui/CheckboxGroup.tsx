"use client";
import React from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  value: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
  exclusiveOption?: string; // e.g., 'none'
}

export const CheckboxGroup = ({
  options,
  value = [],
  onChange,
  className,
  exclusiveOption,
}: CheckboxGroupProps) => {
  const handleCheckedChange = (checked: boolean, optionId: string) => {
    let newValue: string[];

    if (exclusiveOption) {
      if (optionId === exclusiveOption) {
        // If "None" is checked, deselect everything else and select only "None"
        newValue = checked ? [exclusiveOption] : [];
      } else {
        // If another option is checked
        if (checked) {
          // Add it and remove "None" if it's there
          newValue = [...value.filter((id) => id !== exclusiveOption), optionId];
        } else {
          // Just remove it
          newValue = value.filter((id) => id !== optionId);
        }
      }
    } else {
      // Standard non-exclusive behavior
      if (checked) {
        newValue = [...value, optionId];
      } else {
        newValue = value.filter((id) => id !== optionId);
      }
    }

    onChange(newValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={option.id}
            checked={value.includes(option.id)}
            onCheckedChange={(checked) => handleCheckedChange(!!checked, option.id)}
          />
          <Label htmlFor={option.id} className="font-normal">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
};
