"use client";
import React from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface CheckboxOption {
  id: string;
  label: string;
  category?: string;
  red_flag?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  value: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
  exclusiveOption?: string; // e.g., 'none'
  idPrefix?: string;
}

export const CheckboxGroup = ({
  options,
  value = [],
  onChange,
  className,
  exclusiveOption,
  idPrefix,
}: CheckboxGroupProps) => {
  const handleCheckedChange = (checked: boolean, optionId: string) => {
    let newValue: string[];

    if (exclusiveOption) {
      if (optionId === exclusiveOption) {
        newValue = checked ? [exclusiveOption] : [];
      } else {
        if (checked) {
          newValue = [...value.filter((id) => id !== exclusiveOption), optionId];
        } else {
          newValue = value.filter((id) => id !== optionId);
        }
      }
    } else {
      if (checked) {
        newValue = [...value, optionId];
      } else {
        newValue = value.filter((id) => id !== optionId);
      }
    }

    onChange(newValue);
  };

  // Group options by category
  const groupedOptions = options.reduce((acc, option) => {
    const category = option.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {} as Record<string, CheckboxOption[]>);

  const categories = Object.keys(groupedOptions).sort();
  // If no categories (everything is "Other" and original options didn't have category), 
  // revert to simple list to avoid "Other" header unless explicitly mixed.
  const hasCategories = options.some(o => !!o.category);

  const getUniqueId = (optionId: string) => idPrefix ? `${idPrefix}-${optionId}` : optionId;

  if (!hasCategories) {
      return (
        <div className={cn("flex flex-wrap gap-2", className)}>
          {options.map((option) => {
            const isSelected = value.includes(option.id);
            const uniqueId = getUniqueId(option.id);
            return (
            <div key={option.id}>
              <Checkbox
                id={uniqueId}
                checked={isSelected}
                onCheckedChange={(checked) => handleCheckedChange(!!checked, option.id)}
                className="sr-only"
              />
              <Label 
                htmlFor={uniqueId} 
                className={cn(
                    "flex items-center justify-center px-4 py-2 rounded-full border cursor-pointer transition-colors text-sm font-medium",
                    isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
                )}
              >
                {option.label}
              </Label>
            </div>
          )})}
        </div>
      );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {categories.map(category => (
          <div key={category} className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {groupedOptions[category].map((option) => {
                    const isSelected = value.includes(option.id);
                    const uniqueId = getUniqueId(option.id);
                    return (
                        <div key={option.id}>
                            <Checkbox
                                id={uniqueId}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleCheckedChange(!!checked, option.id)}
                                className="sr-only" // Hide default checkbox
                            />
                            <Label 
                                htmlFor={uniqueId} 
                                className={cn(
                                    "flex items-center justify-center px-4 py-2 rounded-full border cursor-pointer transition-colors text-sm font-medium",
                                    isSelected 
                                        ? "bg-primary text-primary-foreground border-primary" 
                                        : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
                                )}
                            >
                                {option.label}
                            </Label>
                        </div>
                    );
                })}
              </div>
          </div>
      ))}
    </div>
  );
};
