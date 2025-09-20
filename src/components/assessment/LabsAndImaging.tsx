import React from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';
import { Input } from '../ui/input';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';

interface LabImagingEntry {
  study_category?: string;
  study_type?: string;
  study_date?: number;
  study_result?: string;
  result_value?: string;
  result_unit?: string;
}

interface LabsAndImagingProps {
  value: LabImagingEntry[];
  onChange: (value: LabImagingEntry[]) => void;
  options: {
    studyCategories: SearchableSelectOption[];
    labTypes: SearchableSelectOption[];
    imagingTypes: SearchableSelectOption[];
    resultSummaries: SearchableSelectOption[];
    commonUnits: string[];
  };
}

export const LabsAndImaging = ({ value, onChange, options }: LabsAndImagingProps) => {

  const handleAdd = () => {
    onChange([...value, {}]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof LabImagingEntry, fieldValue: any) => {
    const newValues = [...value];
    const oldCategory = newValues[index].study_category;
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    
    // If category changes, reset dependent fields
    if (field === 'study_category' && fieldValue !== oldCategory) {
      delete newValues[index].study_type;
      delete newValues[index].result_value;
      delete newValues[index].result_unit;
      delete newValues[index].study_result;
    }

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
            <Label>Study Category</Label>
            <Select value={item.study_category} onValueChange={(val) => handleFieldChange(index, "study_category", val)}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                    {options.studyCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          {item.study_category === 'lab' && (
            <>
              <div className="space-y-2">
                <Label>Lab Test Type</Label>
                <SearchableSelect options={options.labTypes} value={item.study_type} onChange={(val) => handleFieldChange(index, "study_type", val)} placeholder="Search lab test..."/>
              </div>
               <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label>Result Value</Label>
                    <Input value={item.result_value || ""} onChange={(e) => handleFieldChange(index, "result_value", e.target.value)} placeholder="e.g., 12.5"/>
                </div>
                <div className="space-y-2">
                    <Label>Units</Label>
                    <Select value={item.result_unit} onValueChange={(val) => handleFieldChange(index, "result_unit", val)}>
                        <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                        <SelectContent>
                            {options.commonUnits.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
               </div>
            </>
          )}

          {item.study_category === 'imaging' && (
             <>
                <div className="space-y-2">
                    <Label>Imaging Study Type</Label>
                    <SearchableSelect options={options.imagingTypes} value={item.study_type} onChange={(val) => handleFieldChange(index, "study_type", val)} placeholder="Search imaging study..."/>
                </div>
                 <div className="space-y-2">
                    <Label>Result Summary</Label>
                    <Select value={item.study_result} onValueChange={(val) => handleFieldChange(index, "study_result", val)}>
                        <SelectTrigger><SelectValue placeholder="Select result status" /></SelectTrigger>
                        <SelectContent>
                            {options.resultSummaries.map(res => <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Date of Study</Label>
            <YearInput
              value={item.study_date}
              onChange={(val) => handleFieldChange(index, "study_date", val)}
              placeholder="e.g. 2023"
            />
          </div>
        </div>
      )}
    </RepeatingGroup>
  );
};
