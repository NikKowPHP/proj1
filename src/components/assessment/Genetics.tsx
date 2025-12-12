'use client'

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { cn } from '@/lib/utils';
import { FileUploadComponent } from './FileUpload';

interface GeneticsProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
  errors?: Record<string, string | undefined>;
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];

  if (Array.isArray(question.dependsOn.value)) {
    return question.dependsOn.value.includes(dependencyAnswer);
  }

  // Handle Not Equal Logic
  if (question.dependsOn.operator === '!=') {
    return dependencyAnswer !== question.dependsOn.value;
  }

  // Handle Array Contains (new)
  if (question.dependsOn.operator === 'array_contains') {
    try {
      const arr = JSON.parse(dependencyAnswer || '[]');
      return Array.isArray(arr) && arr.includes(question.dependsOn.value);
    } catch (e) {
      return false;
    }
  }

  return dependencyAnswer === question.dependsOn.value;
};

export const Genetics = ({ answers, onAnswer, questions, errors: externalErrors }: GeneticsProps) => {
  const t = useTranslations("AssessmentPage");
  const locale = useLocale();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const getOptionLabel = (opt: any) => {
    const rawLabel = typeof opt === 'object' ? opt.label : opt;
    if (typeof rawLabel === 'object' && rawLabel !== null) {
      const localized = (rawLabel as Record<string, string>)[locale as string];
      return localized ?? (rawLabel as any).en ?? Object.values(rawLabel)[0];
    }
    return rawLabel;
  };

  const handleValidatedChange = (id: string, value: any) => {
    let error: string | undefined = undefined;
    const currentYear = new Date().getFullYear();

    if (id === 'gen.test_year_first' && value > currentYear) {
      error = 'Year cannot be in the future.';
    }

    setErrors(prev => ({ ...prev, [id]: error }));
    onAnswer(id, value);
  };

  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => {
        const key = q.id;
        const error = errors[key] || externalErrors?.[key];
        switch (q.type) {
          case 'select':
          case 'radio':
            return (
              <div key={key} className="space-y-2 animate-fade-in">
                <Label htmlFor={key}>{q.text}</Label>
                <Select onValueChange={(value) => onAnswer(key, value)} value={answers[key] || ""}>
                  <SelectTrigger id={key}><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt: string | { value: string, label: any }) => {
                      if (typeof opt === 'object') {
                        return <SelectItem key={opt.value} value={opt.value}>{getOptionLabel(opt)}</SelectItem>
                      }
                      return <SelectItem key={opt} value={opt}>{getOptionLabel(opt)}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          case 'year_input':
            return (
              <div key={key} className="space-y-2 animate-fade-in">
                <Label htmlFor={key}>{q.text}</Label>
                <YearInput id={key} value={answers[key]} onChange={(val) => handleValidatedChange(key, val)} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'text_input':
            return (
              <div key={key} className="space-y-2 animate-fade-in">
                <Label htmlFor={key}>{q.text}</Label>
                <Input id={key} value={answers[key] || ""} onChange={(e) => handleValidatedChange(key, e.target.value)} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'checkbox_group':
            const isLongList = (q.options?.length > 10);

            // Special grouping logic for gene list if needed, updated to new ID
            if (key === 'gen.self_genes' || key === 'gen.family_genes') {
              return (
                <div key={key} className="space-y-2 animate-fade-in">
                  <Label>{q.text}</Label>
                  <div className={cn("max-h-[400px] overflow-y-auto border  p-4")}>
                    <CheckboxGroup
                      options={q.options}
                      value={answers[key] ? JSON.parse(answers[key]) : []}
                      onChange={(val) => onAnswer(key, JSON.stringify(val))}
                      idPrefix={key}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="space-y-2 animate-fade-in">
                <Label>{q.text}</Label>
                <div className={cn(isLongList && "max-h-[300px] overflow-y-auto border  p-4")}>
                  <CheckboxGroup
                    options={q.options}
                    value={answers[key] ? JSON.parse(answers[key]) : []}
                    onChange={(val) => onAnswer(key, JSON.stringify(val))}
                    idPrefix={key}
                  />
                </div>
              </div>
            );
          case 'file_upload':
            return (
              <FileUploadComponent key={key} question={q} answers={answers} onAnswer={onAnswer} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};