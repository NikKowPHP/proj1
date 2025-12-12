"use client";
import React from "react";
import { Button } from "./button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepeatingGroupProps<T> {
  values: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  children: (item: T, index: number) => React.ReactNode;
  className?: string;
  addLabel?: string;
}

export function RepeatingGroup<T>({
  values,
  onAdd,
  onRemove,
  children,
  className,
  addLabel = "Add item",
}: RepeatingGroupProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      {values.map((item, index) => (
        <div key={index} className="flex items-start gap-2 p-4 border  ">
          <div className="flex-grow">{children(item, index)}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="flex-shrink-0"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={onAdd} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
