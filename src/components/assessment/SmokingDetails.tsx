'use client'

import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { isQuestionVisible } from '@/lib/utils/question-visibility';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SmokingDetailsProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

export const SmokingDetails = ({ answers, onAnswer, questions }: SmokingDetailsProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleValidatedChange = (id: string, value: string, type: string) => {
    let error: string | undefined = undefined;
    
    if (type === 'number_input') {
        const num = Number(value);
        if (value && isNaN(num)) {
            error = t("validNumber");
        } else if (value && num < 0) {
            error = t("positiveValue");
        }

        // Specific validation for smoking intensity
        if (id === 'smoking.intensity') {
            const unit = answers['smoking.intensity_unit'];
            if (unit === 'Packs per day') {
                if (num > 10) error = "Value seems high for packs per day (max 10).";
            } else { // Cigarettes per day (default)
                if (num > 200) error = "Value seems high (max 200).";
            }
        }
    }

    setErrors(prev => ({ ...prev, [id]: error }));
    onAnswer(id, value);
  };

  const visibleQuestions = questions.filter(q => isQuestionVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => {
        const value = answers[q.id] || "";
        const error = errors[q.id];

        // Custom rendering for unit toggle to match "Number with unit toggle" spec
        if (q.id === 'smoking.intensity_unit') {
             return (
                 <div key={q.id} className="space-y-2">
                     <Label>{q.text}</Label>
                     <div className="flex space-x-2">
                         {q.options?.map((opt: string) => (
                             <button
                                 key={opt}
                                 type="button"
                                 onClick={() => onAnswer(q.id, opt)}
                                 className={cn(
                                     "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
                                     value === opt 
                                         ? "bg-primary text-primary-foreground border-primary" 
                                         : "bg-background text-foreground hover:bg-muted border-input"
                                 )}
                             >
                                 {opt}
                             </button>
                         ))}
                     </div>
                 </div>
             )
        }

        return (
        <div key={q.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={q.id}>{q.text}</Label>
            {q.id === 'smoking.years_smoked' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('decadeHelper')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
          
          {q.type === 'year_input' ? (
             <YearInput
              id={q.id}
              value={value}
              onChange={(val) => onAnswer(q.id, val ? String(val) : '')}
              placeholder={q.placeholder}
            />
          ) : q.type === 'date_input' ? (
            <Input
              id={q.id}
              type="date"
              value={value}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder={q.placeholder}
            />
          ) : q.type === 'select' ? (
             <Select onValueChange={(val) => onAnswer(q.id, val)} value={value}>
                <SelectTrigger id={q.id}>
                    <SelectValue placeholder={t("selectOption")} />
                </SelectTrigger>
                <SelectContent>
                    {q.options?.map((opt: any) => {
                         const val = typeof opt === 'object' ? opt.value : opt;
                         const label = typeof opt === 'object' ? (typeof opt.label === 'object' ? opt.label.en : opt.label) : opt;
                         return <SelectItem key={val} value={val}>{label}</SelectItem>
                    })}
                </SelectContent>
             </Select>
          ) : q.type === 'radio' ? (
             <Select onValueChange={(val) => onAnswer(q.id, val)} value={value}>
                <SelectTrigger id={q.id}>
                    <SelectValue placeholder={t("selectOption")} />
                </SelectTrigger>
                <SelectContent>
                    {q.options?.map((opt: any) => {
                         const val = typeof opt === 'object' ? opt.value : opt;
                         const label = typeof opt === 'object' ? (typeof opt.label === 'object' ? opt.label.en : opt.label) : opt;
                         return <SelectItem key={val} value={val}>{label}</SelectItem>
                    })}
                </SelectContent>
             </Select>
          ) : q.type === 'checkbox_group' ? (
             <CheckboxGroup
                options={q.options}
                value={value ? JSON.parse(value) : []}
                onChange={(val) => onAnswer(q.id, JSON.stringify(val))}
                exclusiveOption={q.exclusiveOptionId}
                idPrefix={q.id}
             />
          ) : (
            <>
                <Input
                id={q.id}
                type="number"
                value={value}
                onChange={(e) => handleValidatedChange(q.id, e.target.value, 'number_input')}
                placeholder={q.id === 'smoking.intensity' ? (answers['smoking.intensity_unit'] === 'Packs per day' ? 'e.g. 1.5' : 'e.g. 20') : q.placeholder}
                min="0"
                step={q.id === 'smoking.intensity' && answers['smoking.intensity_unit'] === 'Packs per day' ? "0.1" : "1"}
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>
      )})}
    </div>
  );
};
