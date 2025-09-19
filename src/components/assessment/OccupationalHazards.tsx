import React, { useCallback, useEffect } from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiClient } from '@/lib/services/api-client.service';
import { logger } from '@/lib/logger';

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
  questions: any[];
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  options: {
    jobTitles: SearchableSelectOption[];
    exposures: SearchableSelectOption[];
    ppe: SearchableSelectOption[];
    shiftPatterns: string[];
    intensities: string[];
  };
}

const JobEntryItem = ({
  item,
  index,
  onFieldChange,
  onChipToggle,
  options,
}: {
  item: JobEntry;
  index: number;
  onFieldChange: (index: number, field: keyof JobEntry, fieldValue: any) => void;
  onChipToggle: (jobIndex: number, field: 'occ_exposures' | 'ppe_usage', chipValue: string) => void;
  options: OccupationalHazardsProps['options'];
}) => {

  useEffect(() => {
    if (!item.job_title) {
      return;
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        logger.info(`[JEM] Fetching suggestions for job: ${item.job_title}`);
        const suggestions = await apiClient.jobs.suggestExposures(item.job_title);
        if (isMounted) {
            if (suggestions && suggestions.length > 0) {
                logger.info(`[JEM] Applying suggestions:`, suggestions);
                onFieldChange(index, 'occ_exposures', suggestions);
            } else {
                // When changing to a job with no suggestions, clear the old ones.
                onFieldChange(index, 'occ_exposures', []);
            }
        }
      } catch (error) {
        logger.error('[JEM] Failed to fetch exposure suggestions', { error });
      }
    };

    fetchSuggestions();
    
    return () => {
        isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.job_title, index]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Job Title</Label>
        <SearchableSelect
          value={item.job_title}
          onChange={(val) => onFieldChange(index, "job_title", val)}
          options={options.jobTitles}
          placeholder="Search job title..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Years in this job</Label>
          <YearInput value={item.job_years} onChange={val => onFieldChange(index, 'job_years', val)} placeholder="e.g., 10" />
        </div>
        <div className="space-y-2">
          <Label>Regular night shifts?</Label>
          <Select value={item.job_shift_pattern} onValueChange={val => onFieldChange(index, 'job_shift_pattern', val)}>
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
                onClick={() => onChipToggle(index, 'ppe_usage', exp.value)}
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
                onClick={() => onChipToggle(index, 'occ_exposures', exp.value)}
             >
                {exp.label}
             </Chip>
          ))}
        </div>
      </div>
       {(item.occ_exposures || []).length > 0 && (
        <div className="space-y-2">
          <Label>Intensity of exposure</Label>
           <Select value={item.occ_exposure_intensity} onValueChange={val => onFieldChange(index, 'occ_exposure_intensity', val)}>
            <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
            <SelectContent>
              {options.intensities.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};


export const OccupationalHazards = ({ value, onChange, questions, answers, onAnswer, options }: OccupationalHazardsProps) => {
  const handleAdd = () => {
    onChange([...value, { occ_exposures: [], ppe_usage: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = useCallback((index: number, field: keyof JobEntry, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };
    onChange(newValues);
  }, [value, onChange]);

  const handleChipToggle = useCallback((jobIndex: number, field: 'occ_exposures' | 'ppe_usage', chipValue: string) => {
    const currentValues = value[jobIndex][field] || [];
    const newValues = currentValues.includes(chipValue)
      ? currentValues.filter(e => e !== chipValue)
      : [...currentValues, chipValue];
    handleFieldChange(jobIndex, field, newValues);
  }, [value, handleFieldChange]);

  return (
    <div className="space-y-4">
      {questions.map(q => (
         <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
           <Select onValueChange={(val) => onAnswer(q.id, val)} value={answers[q.id] || ""}>
            <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>
              {q.options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
      <RepeatingGroup
        values={value}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel="Add Job"
      >
        {(item, index) => (
          <JobEntryItem
            key={index}
            item={item}
            index={index}
            onFieldChange={handleFieldChange}
            onChipToggle={handleChipToggle}
            options={options}
          />
        )}
      </RepeatingGroup>
    </div>
  );
};
