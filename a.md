<response>
  <reasoning>
    The user is reporting a React warning: "Encountered two children with the same key, `[object Object]`". This warning occurs when an array of objects is rendered in a list and the `key` prop is assigned the object itself instead of a unique string or number.

    The error stack trace points to `src/components/assessment/SexualHealth.tsx`. An inspection of this file and the data source (`src/lib/assessment-questions.json`) reveals that the `options` for `<Select>` components can be either an array of strings (`string[]`) or an array of objects (`{ value: string; label: string }[]`). The component's code was only handling the `string[]` case, causing the error when it received objects.

    I have identified several other components with the same fragile implementation (`FemaleHealth.tsx`, `EnvironmentalExposures.tsx`, and `OccupationalHazards.tsx`). To fix the immediate bug and prevent future issues, I will update the `.map()` function in all affected components to correctly handle both `string` and object-based options, ensuring unique keys are always used.
  </reasoning>
  <modifications>
    <file path="src/components/assessment/FemaleHealth.tsx">
      <![CDATA[
import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';

interface FemaleHealthProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};

export const FemaleHealth = ({ answers, onAnswer, questions }: FemaleHealthProps) => {
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
            <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
              <SelectTrigger id={q.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((opt: string | { value: string; label: string }) => {
                  const value = typeof opt === 'object' ? opt.value : opt;
                  const label = typeof opt === 'object' ? opt.label : opt;
                  return <SelectItem key={value} value={value}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}
          {q.type === 'year_input' && (
            <YearInput
              id={q.id}
              value={answers[q.id]}
              onChange={(val) => onAnswer(q.id, val ? String(val) : "")}
              placeholder="e.g. 48"
              min={1}
              max={100}
            />
          )}
        </div>
      ))}
    </div>
  );
};
      ]]>
    </file>
    <file path="src/components/assessment/SexualHealth.tsx">
      <![CDATA[
import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface SexualHealthProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};


export const SexualHealth = ({ answers, onAnswer, questions }: SexualHealthProps) => {
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
             <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
              <SelectTrigger id={q.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((opt: string | { value: string; label: string }) => {
                  const value = typeof opt === 'object' ? opt.value : opt;
                  const label = typeof opt === 'object' ? opt.label : opt;
                  return <SelectItem key={value} value={value}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}
           {q.type === 'checkbox_group' && (
            <CheckboxGroup
              options={q.options}
              value={answers[q.id] ? JSON.parse(answers[q.id]) : []}
              onChange={(selected) => onAnswer(q.id, JSON.stringify(selected))}
              exclusiveOption={q.exclusiveOptionId}
            />
          )}
        </div>
      ))}
    </div>
  );
};
      ]]>
    </file>
    <file path="src/components/assessment/EnvironmentalExposures.tsx">
      <![CDATA[
import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface EnvironmentalExposuresProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];

  if (question.dependsOn.value === true) {
     // Handle dependency on a checkbox group having any value
     return !!dependencyAnswer && dependencyAnswer !== '[]' && dependencyAnswer !== 'false';
  }
  
  return dependencyAnswer === question.dependsOn.value;
};


export const EnvironmentalExposures = ({ answers, onAnswer, questions }: EnvironmentalExposuresProps) => {
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
            <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
              <SelectTrigger id={q.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((opt: string | { value: string; label: string }) => {
                  const value = typeof opt === 'object' ? opt.value : opt;
                  const label = typeof opt === 'object' ? opt.label : opt;
                  return <SelectItem key={value} value={value}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}
          {q.type === 'number_input' && (
             <Input
                id={q.id}
                type="number"
                value={answers[q.id] || ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
              />
          )}
           {q.type === 'text_input' && (
             <Input
                id={q.id}
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
              />
          )}
          {q.type === 'year_input' && (
             <YearInput
                id={q.id}
                value={answers[q.id]}
                onChange={(val) => onAnswer(q.id, val ? String(val) : '')}
                placeholder={q.placeholder}
              />
          )}
          {q.type === 'checkbox_group' && (
            <CheckboxGroup
              options={q.options}
              value={answers[q.id] ? JSON.parse(answers[q.id]) : []}
              onChange={(selected) => onAnswer(q.id, JSON.stringify(selected))}
              exclusiveOption={q.exclusiveOptionId}
            />
          )}
           {q.type === 'grouped_input' && (
             <div className="flex gap-2">
                <Input
                    id={q.id}
                    type="number"
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="flex-grow"
                />
                 <Select onValueChange={(value) => onAnswer(q.options.unitQuestionId, value)} value={answers[q.options.unitQuestionId] || ""}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.units.map((opt: string) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};
      ]]>
    </file>
    <file path="src/components/assessment/OccupationalHazards.tsx">
      <![CDATA[
'use client'

import React, { useCallback, useEffect } from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiClient } from '@/lib/services/api-client.service';
import { logger } from '@/lib/logger';
import { Input } from '../ui/input';

interface JobEntry {
  job_title?: string;
  job_years?: number;
  job_shift_pattern?: string;
  ppe_usage?: string[];
  occ_exposures?: string[];
  occ_exposure_intensity?: string;
  occ_exposure_duration?: number;
  occ_radiation_badge?: string;
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
    radiationBadgeOptions: string[];
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
        const suggestions = await apiClient.jobs.suggestExposures(item.job_title!);
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

  }, [item.job_title, index, onFieldChange]);

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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Approx. years exposed</Label>
              <Input type="number" value={item.occ_exposure_duration || ''} onChange={e => onFieldChange(index, 'occ_exposure_duration', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g., 5"/>
            </div>
            <div className="space-y-2">
              <Label>Intensity of exposure</Label>
              <Select value={item.occ_exposure_intensity} onValueChange={val => onFieldChange(index, 'occ_exposure_intensity', val)}>
                <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
                <SelectContent>
                  {options.intensities.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>Worked with radiation badge?</Label>
        <Select value={item.occ_radiation_badge} onValueChange={val => onFieldChange(index, 'occ_radiation_badge', val)}>
            <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>
              {options.radiationBadgeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
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
              {q.options.map((opt: string | { value: string; label: string }) => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const label = typeof opt === 'object' ? opt.label : opt;
                return <SelectItem key={value} value={value}>{label}</SelectItem>;
              })}
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
      ]]>
    </file>
  </modifications>
</response>