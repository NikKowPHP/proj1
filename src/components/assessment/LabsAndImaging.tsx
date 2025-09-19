import React from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';
import { Input } from '../ui/input';

interface LabImagingEntry {
  study_type?: string;
  study_date?: number;
  study_result?: string;
}

interface LabsAndImagingProps {
  value: LabImagingEntry[];
  onChange: (value: LabImagingEntry[]) => void;
}

export const LabsAndImaging = ({ value, onChange }: LabsAndImagingProps) => {

  const handleAdd = () => {
    onChange([...value, {}]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof LabImagingEntry, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    onChange(newValues);
  };

  return (
    <RepeatingGroup
      values={value}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel="Add Lab or Imaging Study"
    >
      {(item, index) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Study Type</Label>
            <Input
              value={item.study_type}
              onChange={(e) => handleFieldChange(index, "study_type", e.target.value)}
              placeholder="e.g., CBC, Chest X-ray, CA-125"
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Study</Label>
            <YearInput
              value={item.study_date}
              onChange={(val) => handleFieldChange(index, "study_date", val)}
              placeholder="e.g. 2023"
            />
          </div>
          <div className="space-y-2">
            <Label>Result Summary</Label>
            <Select
              value={item.study_result}
              onValueChange={(val) => handleFieldChange(index, "study_result", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_findings">No significant findings</SelectItem>
                <SelectItem value="indeterminate">Indeterminate findings</SelectItem>
                <SelectItem value="significant">Significant findings noted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </RepeatingGroup>
  );
};
