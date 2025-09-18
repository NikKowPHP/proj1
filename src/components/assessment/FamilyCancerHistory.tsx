import React from "react";
import { RepeatingGroup } from "../ui/RepeatingGroup";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SearchableSelect, SearchableSelectOption } from "../ui/SearchableSelect";
import { YearInput } from "../ui/YearInput";

interface FamilyMember {
  relation?: string;
  cancer_type?: string;
  age_dx?: number;
}

interface FamilyCancerHistoryProps {
  value: FamilyMember[];
  onChange: (value: FamilyMember[]) => void;
  options: {
    relations: string[];
    cancerTypes: SearchableSelectOption[];
  };
}

export const FamilyCancerHistory = ({ value, onChange, options }: FamilyCancerHistoryProps) => {
  const handleAdd = () => {
    onChange([...value, {}]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof FamilyMember, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    onChange(newValues);
  };

  return (
    <RepeatingGroup
      values={value}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel="Add Relative"
    >
      {(item, index) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Relation</Label>
            <Select
              value={item.relation}
              onValueChange={(val) => handleFieldChange(index, "relation", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                {options.relations.map((relation) => (
                  <SelectItem key={relation} value={relation}>
                    {relation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type of Cancer</Label>
             <SearchableSelect
              value={item.cancer_type}
              onChange={(val) => handleFieldChange(index, "cancer_type", val)}
              options={options.cancerTypes}
              placeholder="Search cancer type..."
            />
          </div>
          <div className="space-y-2">
            <Label>Age at Diagnosis</Label>
            <YearInput
              value={item.age_dx}
              onChange={(val) => handleFieldChange(index, "age_dx", val)}
              placeholder="e.g. 55"
              min={0}
              max={120}
            />
          </div>
        </div>
      )}
    </RepeatingGroup>
  );
};
