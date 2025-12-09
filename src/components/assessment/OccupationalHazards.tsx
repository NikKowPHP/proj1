'use client'

import React, { useCallback, useEffect, useMemo } from 'react';
import { Label } from '../ui/label';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiClient } from '@/lib/services/api-client.service';
import { logger } from '@/lib/logger';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// New Interface Matching PDF "Hazard-centric" model
export interface HazardExposure {
  hazardId: string;
  hazardLabel?: string;
  main_job_title?: string;
  years_total?: number;
  hours_per_week?: number;
  current_exposure?: string; // Yes/No
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
    exposures: SearchableSelectOption[]; // Used to map ID to Label
    ppe: SearchableSelectOption[];
    shiftPatterns: string[];
    intensities: string[];
    radiationBadgeOptions: string[];
  };
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
  // Find label for hazard
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
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Exposure Details: {hazardLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Main Job Title during exposure</Label>
          <SearchableSelect
             value={item.main_job_title}
             onChange={(val) => handleFieldChange("main_job_title", val)}
             options={options.jobTitles}
             placeholder="Search job title..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label>Total Years Exposed</Label>
             <Input 
                type="number" 
                value={item.years_total ?? ""} 
                onChange={(e) => handleFieldChange("years_total", e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="e.g. 5"
             />
          </div>
          <div className="space-y-2">
             <Label>Hours per Week</Label>
             <Input 
                type="number" 
                value={item.hours_per_week ?? ""} 
                onChange={(e) => handleFieldChange("hours_per_week", e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="e.g. 40"
             />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label>Year First Exposed</Label>
             <Input 
                type="number"
                value={item.year_first_exposed ?? ""}
                onChange={(e) => handleFieldChange("year_first_exposed", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 1990"
             />
           </div>
           <div className="space-y-2">
             {/* Spacer or future field */}
           </div>
        </div>
        <div className="space-y-2">
            <Label>Currently Exposed?</Label>
            <Select value={item.current_exposure} onValueChange={(val) => handleFieldChange("current_exposure", val)}>
                <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label>PPE Used</Label>
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

export const OccupationalHazards = ({ value, onChange, questions, answers, onAnswer, options }: OccupationalHazardsProps) => {
  
  // Sync selected hazards from checks to the value array
  const selectedHazards: string[] = answers['occ.hazards.subs'] || [];

  useEffect(() => {
     // Ensure we have an entry for each selected hazard
     // And remove entries for deselected hazards
     const currentHazardsInValue = value.map(v => v.hazardId);
     
     const missingHazards = selectedHazards.filter(h => !currentHazardsInValue.includes(h) && h !== 'none');
     const extraHazards = currentHazardsInValue.filter(h => !selectedHazards.includes(h));

     if (missingHazards.length === 0 && extraHazards.length === 0) return;

     let newValue = [...value];
     
     // Remove extras
     if (extraHazards.length > 0) {
        newValue = newValue.filter(v => selectedHazards.includes(v.hazardId));
     }

     // Add missing
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
      {/* 1. Render Top Level Questions (including the Hazard Checkbox) */}
      <div className="space-y-4">
      {questions.map(q => {
          switch (q.type) {
            case 'select':
              return (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id}>{q.text}</Label>
                  <Select onValueChange={(val) => onAnswer(q.id, val)} value={answers[q.id] || ""}>
                    <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent>
                      {(q.options || []).map((opt: string | { value: string; label: string }) => {
                        const value = typeof opt === 'object' ? opt.value : opt;
                        const label = typeof opt === 'object' ? opt.label : opt;
                        return <SelectItem key={value} value={value}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            case 'number_input':
              return (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id}>{q.text}</Label>
                  <Input
                    id={q.id}
                    type="number"
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                  />
                </div>
              );
            case 'checkbox_group':
              return (
                <div key={q.id} className="space-y-2">
                  <Label>{q.text}</Label>
                  <CheckboxGroup
                    options={q.options || []}
                    value={answers[q.id] || []}
                    onChange={(val) => onAnswer(q.id, val)}
                    exclusiveOption={q.exclusiveOptionId}
                  />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>

      {/* 2. Render Details for Selected Hazards */}
      {selectedHazards.length > 0 && !selectedHazards.includes('none') && (
          <div className="space-y-4">
              <Label className="text-lg font-semibold">Detailed Hazard Assessments</Label>
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