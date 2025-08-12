"use client";
import React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface GuidedPopoverProps {
  children: React.ReactNode;
  title: string;
  description: string;
  isOpen: boolean;
  onDismiss: () => void;
  placement?: "top" | "bottom";
}
export const GuidedPopover = ({
  children,
  title,
  description,
  isOpen,
  onDismiss,
  placement = "top",
}: GuidedPopoverProps) => {
  if (!isOpen) return <>{children}</>;

  return (
    <div className="relative">
      <div className="absolute -top-4 -left-4 -right-4 -bottom-4 border-2 border-primary border-dashed rounded-xl z-10 pointer-events-none animate-in fade-in duration-500" />
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-64 bg-background p-3 rounded-lg shadow-2xl border z-50 animate-in fade-in duration-500",
          placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <h4 className="font-bold text-sm pr-6">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
};