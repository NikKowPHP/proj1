import React from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface CancerDiagnosis {
  type?: string;
  year_dx?: number;
  treatments?: string[];
}

interface PersonalCancerHistoryProps {
  value: CancerDiagnosis[];
  onChange: (value: CancerDiagnosis[]) => void;
  options: {
    cancerTypes: SearchableSelectOption[];
    treatmentTypes: {id: string, label: string}[];
  };
}

export const PersonalCancerHistory = ({ value, onChange, options }: PersonalCancerHistoryProps) => {
  const handleAdd = () => {
    onChange([...value, { treatments: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof CancerDiagnosis, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    onChange(newValues);
  };

  return (
    <RepeatingGroup
      values={value}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel="Add Diagnosis"
    >
      {(item, index) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type of Cancer</Label>
            <SearchableSelect
              value={item.type}
              onChange={(val) => handleFieldChange(index, 'type', val)}
              options={options.cancerTypes}
              placeholder="Search cancer type..."
            />
          </div>
          <div className="space-y-2">
            <Label>Year of Diagnosis</Label>
            <YearInput
              value={item.year_dx}
              onChange={(val) => handleFieldChange(index, 'year_dx', val)}
              placeholder="e.g. 2015"
            />
          </div>
          <div className="space-y-2">
            <Label>Treatments Received</Label>
            <CheckboxGroup
              options={options.treatmentTypes}
              value={item.treatments || []}
              onChange={(val) => handleFieldChange(index, 'treatments', val)}
            />
          </div>
        </div>
      )}
    </RepeatingGroup>
  );
};
