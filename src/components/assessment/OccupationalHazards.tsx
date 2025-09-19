import React from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface JobEntry {
  job_title?: string;
  job_years?: number;
  job_shift_pattern?: string;
  ppe_usage?: string[];
  occ_exposures?: string[];
  occ_exposure_intensity?: string;
}

interface OccupationalHazardsProps {
  value: JobEntry[];
  onChange: (value: JobEntry[]) => void;
  options: {
    jobTitles: SearchableSelectOption[];
    exposures: SearchableSelectOption[];
    ppe: SearchableSelectOption[];
    shiftPatterns: string[];
    intensities: string[];
  };
}

export const OccupationalHazards = ({ value, onChange, options }: OccupationalHazardsProps) => {
  const handleAdd = () => {
    onChange([...value, { occ_exposures: [], ppe_usage: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof JobEntry, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    onChange(newValues);
  };

  const handleChipToggle = (jobIndex: number, field: 'occ_exposures' | 'ppe_usage', chipValue: string) => {
    const currentValues = value[jobIndex][field] || [];
    const newValues = currentValues.includes(chipValue)
      ? currentValues.filter(e => e !== chipValue)
      : [...currentValues, chipValue];
    handleFieldChange(jobIndex, field, newValues);
  };

  return (
    <RepeatingGroup
      values={value}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel="Add Job"
    >
      {(item, index) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Job Title</Label>
            <SearchableSelect
              value={item.job_title}
              onChange={(val) => handleFieldChange(index, "job_title", val)}
              options={options.jobTitles}
              placeholder="Search job title..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Years in this job</Label>
              <YearInput value={item.job_years} onChange={val => handleFieldChange(index, 'job_years', val)} placeholder="e.g., 10" />
            </div>
            <div className="space-y-2">
              <Label>Regular night shifts?</Label>
              <Select value={item.job_shift_pattern} onValueChange={val => handleFieldChange(index, 'job_shift_pattern', val)}>
                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  {options.shiftPatterns.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Protective equipment used</Label>
            <div className="flex flex-wrap gap-2">
              {options.ppe.map(exp => (
                 <Chip
                    key={exp.value}
                    variant="selectable"
                    selected={(item.ppe_usage || []).includes(exp.value)}
                    onClick={() => handleChipToggle(index, 'ppe_usage', exp.value)}
                 >
                    {exp.label}
                 </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Potential Exposures in this job</Label>
            <div className="flex flex-wrap gap-2">
              {options.exposures.map(exp => (
                 <Chip
                    key={exp.value}
                    variant="selectable"
                    selected={(item.occ_exposures || []).includes(exp.value)}
                    onClick={() => handleChipToggle(index, 'occ_exposures', exp.value)}
                 >
                    {exp.label}
                 </Chip>
              ))}
            </div>
          </div>
           {(item.occ_exposures || []).length > 0 && (
            <div className="space-y-2">
              <Label>Intensity of exposure</Label>
               <Select value={item.occ_exposure_intensity} onValueChange={val => handleFieldChange(index, 'occ_exposure_intensity', val)}>
                <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
                <SelectContent>
                  {options.intensities.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </RepeatingGroup>
  );
};
      