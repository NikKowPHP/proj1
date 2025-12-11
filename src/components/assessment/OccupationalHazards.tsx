'use client'

import React, { useEffect } from 'react';
import { Label } from '../ui/label';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Chip } from '../ui/chip';

export interface HazardExposure {
  hazardId: string;
  hazardLabel?: string;
  main_job_title?: string;
  years_total?: number;
  hours_per_week?: number;
  current_exposure?: string;
  ppe_use?: string[];
  year_first_exposed?: number;
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
  options
}: {
  hazardId: string;
  item: HazardExposure;
  onChange: (newItem: HazardExposure) => void;
  options: OccupationalHazardsProps['options'];
}) => {
  const hazardLabel = options.exposures.find(e => e.value === hazardId)?.label || hazardId;

  const handleFieldChange = (field: keyof HazardExposure, val: any) => {
    onChange({ ...item, [field]: val });
  };

  const togglePPE = (ppeVal: string) => {
    const current = item.ppe_use || [];
    const newPPE = current.includes(ppeVal) ? current.filter(x => x !== ppeVal) : [...current, ppeVal];
    handleFieldChange('ppe_use', newPPE);
  };

  return (
    <Card className="mb-4 bg-muted/20">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{hazardLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Job Title</Label>
          <SearchableSelect
            value={item.main_job_title}
            onChange={(val) => handleFieldChange("main_job_title", val)}
            options={options.jobTitles}
            placeholder="Select job title..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Years Exposed</Label>
            <Input
              type="number"
              value={item.years_total ?? ""}
              onChange={(e) => handleFieldChange("years_total", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 10"
            />
          </div>
          <div className="space-y-2">
            <Label>Year First Exposed</Label>
            <Input
              type="number"
              value={item.year_first_exposed ?? ""}
              onChange={(e) => handleFieldChange("year_first_exposed", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 1990"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Protective Equipment (PPE)</Label>
          <div className="flex flex-wrap gap-2">
            {options.ppe.map(ppe => (
              <Chip key={ppe.value} variant="selectable" selected={(item.ppe_use || []).includes(ppe.value)} onClick={() => togglePPE(ppe.value)}>
                {ppe.label}
              </Chip>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};