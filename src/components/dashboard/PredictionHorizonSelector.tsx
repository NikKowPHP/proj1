
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PredictionHorizon = '1m' | '3m' | '1y';

interface PredictionHorizonSelectorProps {
  value: PredictionHorizon;
  onChange: (value: PredictionHorizon) => void;
}

export const PredictionHorizonSelector = ({ value, onChange }: PredictionHorizonSelectorProps) => (
  <div className="flex items-center gap-1 bg-secondary p-1 rounded-md">
    <Button
      size="sm"
      variant={value === '1m' ? 'secondary' : 'ghost'}
      className={cn("h-7", value === '1m' && "bg-background shadow-sm")}
      onClick={() => onChange('1m')}
    >
      1M
    </Button>
    <Button
      size="sm"
      variant={value === '3m' ? 'secondary' : 'ghost'}
      className={cn("h-7", value === '3m' && "bg-background shadow-sm")}
      onClick={() => onChange('3m')}
    >
      3M
    </Button>
    <Button
      size="sm"
      variant={value === '1y' ? 'secondary' : 'ghost'}
      className={cn("h-7", value === '1y' && "bg-background shadow-sm")}
      onClick={() => onChange('1y')}
    >
      1Y
    </Button>
  </div>
);