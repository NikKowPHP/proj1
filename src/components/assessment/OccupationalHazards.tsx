import React, { useState } from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';
import { Input } from '../ui/input';

interface JobEntry {
  job_title?: string;
  start_year?: string;
  end_year?: string;
  occ_exposures?: string[];
}

interface OccupationalHazardsProps {
  value: JobEntry[];
  onChange: (value: JobEntry[]) => void;
  options: {
    jobTitles: SearchableSelectOption[];
    exposures: SearchableSelectOption[];
  };
}

export const OccupationalHazards = ({ value, onChange, options }: OccupationalHazardsProps) => {
  const handleAdd = () => {
    onChange([...value, { occ_exposures: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof JobEntry, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    onChange(newValues);
  };

  const handleExposureToggle = (jobIndex: number, exposureValue: string) => {
    const currentExposures = value[jobIndex].occ_exposures || [];
    const newExposures = currentExposures.includes(exposureValue)
      ? currentExposures.filter(e => e !== exposureValue)
      : [...currentExposures, exposureValue];
    handleFieldChange(jobIndex, 'occ_exposures', newExposures);
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
              <Label>Start Year</Label>
              <Input type="number" placeholder="e.g., 1995" value={item.start_year || ''} onChange={e => handleFieldChange(index, 'start_year', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Year</Label>
              <Input type="number" placeholder="e.g., 2010" value={item.end_year || ''} onChange={e => handleFieldChange(index, 'end_year', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Potential Exposures</Label>
            <div className="flex flex-wrap gap-2">
              {options.exposures.map(exp => (
                 <Chip
                    key={exp.value}
                    variant="selectable"
                    selected={(item.occ_exposures || []).includes(exp.value)}
                    onClick={() => handleExposureToggle(index, exp.value)}
                 >
                    {exp.label}
                 </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </RepeatingGroup>
  );
};
