'use client'

import React, { useEffect } from 'react';
import { Label } from '../ui/label';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Chip } from '../ui/chip';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface HazardExposure {
  hazardId: string;
  hazardLabel?: string;
  [key: string]: any;
}

interface OccupationalHazardsProps {
  value: HazardExposure[];
  onChange: (value: HazardExposure[]) => void;
  questions: any[];
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  options: {
    jobTitles: SearchableSelectOption[];
    exposures: SearchableSelectOption[];
    ppe: SearchableSelectOption[];
  };
  errors?: Record<string, string | undefined>;
}

const HazardDetailItem = ({
  hazardId,
  item,
  onChange,
  options,
  questions
}: {
  hazardId: string;
  item: HazardExposure;
  onChange: (newItem: HazardExposure) => void;
  options: OccupationalHazardsProps['options'];
  questions: any[];
}) => {
  const t = useTranslations("AssessmentPage"); // Assuming generic translations or passed down
  const hazardLabel = options.exposures.find(e => e.value === hazardId)?.label || hazardId;

  const handleFieldChange = (field: string, val: any) => {
    onChange({ ...item, [field]: val });
  };

  // Helper to interpret "options" string from JSON (e.g. "jobTitles")
  const getOptions = (optRef: string | any[]) => {
    if (Array.isArray(optRef)) return optRef;
    if (optRef === 'jobTitles') return options.jobTitles;
    if (optRef === 'ppe') return options.ppe;
    if (optRef === 'exposures') return options.exposures;
    return [];
  };

  return (
    <Card className="mb-4 bg-muted/20 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{hazardLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions?.map((q) => {
          const label = typeof q.label === 'object' ? (q.label.en || q.label) : q.label; // Simplify locale access
          const placeholder = typeof q.placeholder === 'object' ? (q.placeholder.en || q.placeholder) : q.placeholder;

          if (q.type === 'searchable_select') {
            return (
              <div key={q.id} className="space-y-2">
                <Label>{label}</Label>
                <SearchableSelect
                  value={item[q.id]}
                  onChange={(val) => handleFieldChange(q.id, val)}
                  options={getOptions(q.options)}
                  placeholder={placeholder || "Select..."}
                  allowCustom={q.allowCustom}
                />
              </div>
            );
          }
          if (q.type === 'number_input') {
            return (
              <div key={q.id} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={item[q.id] ?? ""}
                  onChange={(e) => handleFieldChange(q.id, e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={placeholder}
                  min={q.min}
                  max={q.max}
                />
              </div>
            );
          }
          if (q.type === 'select') {
            const opts = getOptions(q.options);
            return (
              <div key={q.id} className="space-y-2">
                <Label>{label}</Label>
                <Select
                  value={Array.isArray(item[q.id]) ? item[q.id][0] : (item[q.id] || "")}
                  onValueChange={(val) => handleFieldChange(q.id, [val])} // Keeping array format for compat with some types
                >
                  <SelectTrigger>
                    <SelectValue placeholder={placeholder || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {opts.map((opt: any) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {typeof opt.label === 'object' ? opt.label.en : opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }
          if (q.type === 'radio') {
            const opts = typeof q.options === 'string' ? getOptions(q.options) : q.options;
            return (
              <div key={q.id} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex space-x-2">
                  {opts.map((opt: any) => {
                    const val = typeof opt === 'object' ? opt.value : opt;
                    const lbl = typeof opt === 'object' ? (opt.label.en || opt.label) : opt;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleFieldChange(q.id, val)}
                        className={cn(
                          "px-3 py-2 text-sm font-medium transition-colors border rounded-md flex-1",
                          item[q.id] === val
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground hover:bg-muted border-input"
                        )}
                      >
                        {lbl}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          }
          if (q.type === 'textarea') {
            return (
              <div key={q.id} className="space-y-2">
                <Label>{label}</Label>
                <Textarea
                  value={item[q.id] || ""}
                  onChange={(e) => handleFieldChange(q.id, e.target.value)}
                  placeholder={placeholder}
                  maxLength={q.maxLength}
                />
              </div>
            )
          }
          if (q.type === 'checkbox_group') {
            const opts = getOptions(q.options).map((o: any) => ({
              id: o.value, // Mapping value to id for CheckboxGroup
              label: typeof o.label === 'object' ? (o.label.en || o.label) : o.label
            }));
            return (
              <div key={q.id} className="space-y-2">
                <Label>{label}</Label>
                <CheckboxGroup
                  options={opts}
                  value={item[q.id] || []}
                  onChange={(val) => handleFieldChange(q.id, val)}
                />
              </div>
            )
          }
          return null;
        })}
      </CardContent>
    </Card >
  );
};

export const OccupationalHazards = ({ value, onChange, questions, answers, onAnswer, options, errors }: OccupationalHazardsProps) => {
  // Sync selected hazards from the new ID
  const selectedHazards: string[] = answers['occ.hazards.subs'] ? JSON.parse(answers['occ.hazards.subs']) : [];

  useEffect(() => {
    const currentHazardsInValue = value.map(v => v.hazardId);
    const missingHazards = selectedHazards.filter(h => !currentHazardsInValue.includes(h) && h !== 'none');
    const extraHazards = currentHazardsInValue.filter(h => !selectedHazards.includes(h));

    if (missingHazards.length === 0 && extraHazards.length === 0) return;

    let newValue = [...value];
    if (extraHazards.length > 0) {
      newValue = newValue.filter(v => selectedHazards.includes(v.hazardId));
    }
    missingHazards.forEach(h => {
      newValue.push({
        hazardId: h,
        hazardLabel: options.exposures.find(e => e.value === h)?.label
      });
    });
    onChange(newValue);
  }, [selectedHazards, value, onChange, options.exposures]);

  const handleItemChange = (newItem: HazardExposure) => {
    const newValue = value.map(v => v.hazardId === newItem.hazardId ? newItem : v);
    onChange(newValue);
  };

  return (
    <div className="space-y-6">
      {/* Detail Rows */}
      {selectedHazards.length > 0 && !selectedHazards.includes('none') && (
        <div className="space-y-4">
          {value.map(item => (
            <HazardDetailItem
              key={item.hazardId}
              hazardId={item.hazardId}
              item={item}
              onChange={handleItemChange}
              options={options}
              questions={questions}
            />
          ))}
        </div>
      )}
    </div>
  );
};