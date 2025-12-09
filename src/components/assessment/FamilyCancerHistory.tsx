'use client'

import React, { useState } from "react";
import { RepeatingGroup } from "../ui/RepeatingGroup";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SearchableSelect, SearchableSelectOption } from "../ui/SearchableSelect";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";

interface FamilyMember {
  relation?: string;
  side_of_family?: string; // Maternal, Paternal
  vital_status?: string; // Alive, Deceased
  age_now_death?: number; // Age now or at death
  cancer_type?: string;
  age_dx?: number;
  multiple_primaries?: boolean;
  known_genetic_syndrome?: boolean;
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
  const [errors, setErrors] = useState<Record<number, { age_dx?: string, age_now_death?: string }>>({});

  const handleAdd = () => {
    onChange([...value, {}]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof FamilyMember, fieldValue: any) => {
    if (field === "age_dx" || field === "age_now_death") {
      const num = Number(fieldValue);
      if (fieldValue && (isNaN(num) || num < 0 || num > 120)) {
        setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: 'Invalid age.' } }));
      } else {
        const newErrors = { ...errors[index] };
        delete newErrors[field];
        setErrors(prev => ({ ...prev, [index]: newErrors }));
      }
    }

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
        <div className="space-y-4 border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Side of Family</Label>
              <Select
                value={item.side_of_family}
                onValueChange={(val) => handleFieldChange(index, "side_of_family", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maternal">Maternal</SelectItem>
                  <SelectItem value="Paternal">Paternal</SelectItem>
                  <SelectItem value="N/A">N/A (e.g. Sibling)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Vital Status</Label>
               <Select
                value={item.vital_status}
                onValueChange={(val) => handleFieldChange(index, "vital_status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alive">Alive</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
               <Label>{item.vital_status === 'Deceased' ? 'Age at Death' : 'Current Age'}</Label>
               <Input
                  type="number"
                  value={item.age_now_death ?? ""}
                  onChange={(e) => handleFieldChange(index, "age_now_death", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 65"
               />
               {errors[index]?.age_now_death && <p className="text-sm text-destructive">{errors[index].age_now_death}</p>}
            </div>
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
            <Input
              type="number"
              value={item.age_dx ?? ""}
              onChange={(e) => handleFieldChange(index, "age_dx", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 55"
              min={0}
              max={100}
              aria-invalid={!!errors[index]?.age_dx}
            />
            {errors[index]?.age_dx && <p className="text-sm text-destructive">{errors[index].age_dx}</p>}
          </div>
          
           <div className="flex flex-wrap gap-4">
             <div className="flex items-center space-x-2">
              <Checkbox
                id={`multiple_primaries_${index}`}
                checked={item.multiple_primaries}
                onCheckedChange={(checked) => handleFieldChange(index, "multiple_primaries", !!checked)}
              />
              <Label htmlFor={`multiple_primaries_${index}`} className="font-normal">
                Multiple primary cancers?
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`genetic_syndrome_${index}`}
                checked={item.known_genetic_syndrome}
                onCheckedChange={(checked) => handleFieldChange(index, "known_genetic_syndrome", !!checked)}
              />
              <Label htmlFor={`genetic_syndrome_${index}`} className="font-normal">
                Known Genetic Syndrome?
              </Label>
            </div>
          </div>
        </div>
      )}
    </RepeatingGroup>
  );
};