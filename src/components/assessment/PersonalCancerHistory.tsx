'use client'

import React, { useState } from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

interface CancerDiagnosis {
  type?: string;
  year_dx?: number;
  age_at_dx?: number;
  treatments?: string[];
  last_followup?: number;
  // New fields
  stage_group?: string; // I, II, III, IV, 0
  laterality?: string; // Left, Right, Bilateral
  recurrence_ever?: boolean;
  metastatic_ever?: boolean;
  genetic_flag?: boolean;
  status_current?: string; // No evidence of disease, In remission, Active treatment, Stable
  surgery_type?: string; // Mastectomy, Lumpectomy
}

interface PersonalCancerHistoryProps {
  value: CancerDiagnosis[];
  onChange: (value: CancerDiagnosis[]) => void;
  options: {
    cancerTypes: SearchableSelectOption[];
    treatmentTypes: {id: string, label: string}[];
    stageOptions?: {value: string, label: string}[];
    lateralityOptions?: {value: string, label: string}[];
  };
}

export const PersonalCancerHistory = ({ value, onChange, options }: PersonalCancerHistoryProps) => {
  const [errors, setErrors] = useState<Record<number, { year_dx?: string, last_followup?: string }>>({});

  const handleAdd = () => {
    onChange([...value, { treatments: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof CancerDiagnosis, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };

    if (field === 'year_dx' || field === 'last_followup') {
      const currentYear = new Date().getFullYear();
      if (fieldValue > currentYear) {
        setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: 'Year cannot be in the future.' }}));
      } else {
        const newErrors = { ...errors[index] };
        delete newErrors[field];
        setErrors(prev => ({ ...prev, [index]: newErrors }));
      }
    }
    
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
        <div className="space-y-4 border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
          <div className="space-y-2">
            <Label>Type of Cancer</Label>
            <SearchableSelect
              value={item.type}
              onChange={(val) => handleFieldChange(index, 'type', val)}
              options={options.cancerTypes}
              placeholder="Search cancer type..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year of Diagnosis</Label>
              <YearInput
                value={item.year_dx}
                onChange={(val) => handleFieldChange(index, 'year_dx', val)}
                placeholder="e.g. 2015"
                aria-invalid={!!errors[index]?.year_dx}
              />
              {errors[index]?.year_dx && <p className="text-sm text-destructive">{errors[index].year_dx}</p>}
            </div>
            <div className="space-y-2">
              <Label>Age at Diagnosis (Optional)</Label>
               <input
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={item.age_at_dx || ""}
                onChange={(e) => handleFieldChange(index, 'age_at_dx', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 45"
              />
            </div>
             <div className="space-y-2">
              <Label>Last Follow-up Year</Label>
              <YearInput
                value={item.last_followup}
                onChange={(val) => handleFieldChange(index, 'last_followup', val)}
                placeholder="e.g. 2023"
                aria-invalid={!!errors[index]?.last_followup}
              />
              {errors[index]?.last_followup && <p className="text-sm text-destructive">{errors[index].last_followup}</p>}
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Stage at Diagnosis</Label>
               <Select value={item.stage_group} onValueChange={(val) => handleFieldChange(index, 'stage_group', val)}>
                 <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                 <SelectContent>
                   {(options.stageOptions || []).map(opt => (
                     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                   ))}
                   {/* Fallback if options not passed */}
                   {!options.stageOptions && (
                      <>
                        <SelectItem value="0">Stage 0</SelectItem>
                        <SelectItem value="I">Stage I</SelectItem>
                        <SelectItem value="II">Stage II</SelectItem>
                        <SelectItem value="III">Stage III</SelectItem>
                        <SelectItem value="IV">Stage IV</SelectItem>
                      </>
                   )}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
               <Label>Laterality</Label>
               <Select value={item.laterality} onValueChange={(val) => handleFieldChange(index, 'laterality', val)}>
                 <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                 <SelectContent>
                   {(options.lateralityOptions || []).map(opt => (
                     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                   ))}
                   {!options.lateralityOptions && (
                     <>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Right">Right</SelectItem>
                        <SelectItem value="Bilateral">Bilateral</SelectItem>
                     </>
                   )}
                 </SelectContent>
               </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
             <div className="flex items-center space-x-2">
                <Checkbox
                  id={`recurrence_${index}`}
                  checked={item.recurrence_ever}
                  onCheckedChange={(c) => handleFieldChange(index, 'recurrence_ever', !!c)}
                />
                <Label htmlFor={`recurrence_${index}`} className="font-normal">Recurrence ever?</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox
                  id={`metastatic_${index}`}
                  checked={item.metastatic_ever}
                  onCheckedChange={(c) => handleFieldChange(index, 'metastatic_ever', !!c)}
                />
                <Label htmlFor={`metastatic_${index}`} className="font-normal">Metastatic ever?</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox
                  id={`genetic_${index}`}
                  checked={item.genetic_flag}
                  onCheckedChange={(c) => handleFieldChange(index, 'genetic_flag', !!c)}
                />
                <Label htmlFor={`genetic_${index}`} className="font-normal">Linked to known genetic syndrome?</Label>
             </div>
          </div>

          <div className="space-y-2">
            <Label>Current Status</Label>
            <Select value={item.status_current} onValueChange={(val) => handleFieldChange(index, 'status_current', val)}>
              <SelectTrigger><SelectValue placeholder="Select current status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no_evidence">No evidence of disease</SelectItem>
                <SelectItem value="in_remission">In remission</SelectItem>
                <SelectItem value="active_treatment">Active treatment</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <CheckboxGroup
              options={options.treatmentTypes}
              value={item.treatments || []}
              onChange={(val) => handleFieldChange(index, 'treatments', val)}
            />
          </div>

          {/* Granular Surgery Details (Example for Breast Cancer) */}
          {(item.treatments || []).includes('surgery') && (item.type?.toLowerCase().includes('breast')) && (
            <div className="space-y-2">
               <Label>Surgery Type</Label>
               <Select value={item.surgery_type} onValueChange={(val) => handleFieldChange(index, 'surgery_type', val)}>
                 <SelectTrigger><SelectValue placeholder="Select surgery type" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="mastectomy">Mastectomy</SelectItem>
                   <SelectItem value="lumpectomy">Lumpectomy</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          )}
        </div>
      )}
    </RepeatingGroup>
  );
};