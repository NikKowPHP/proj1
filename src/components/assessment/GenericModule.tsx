'use client'

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { FileUploadComponent } from './FileUpload';

interface GenericModuleProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];

  // Handle checking for checking if array includes value
  if (Array.isArray(question.dependsOn.value)) {
     // If dependency answer is an array string (e.g. from checkbox_group)
     try {
         const parsedDep = JSON.parse(dependencyAnswer);
         if (Array.isArray(parsedDep)) {
             // If any of the dependent required values is in the answer array
             return parsedDep.some(v => question.dependsOn.value.includes(v));
         }
     } catch (e) {
         // Not a JSON array, treat as simple string
         return question.dependsOn.value.includes(dependencyAnswer);
     }
      return question.dependsOn.value.includes(dependencyAnswer);
  }
  
  // Handle simple dependency match
  return dependencyAnswer === question.dependsOn.value;
};

export const GenericModule = ({ answers, onAnswer, questions }: GenericModuleProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleValidatedChange = (id: string, value: any, type?: string) => {
    let error: string | undefined = undefined;
    const currentYear = new Date().getFullYear();

    if (type === 'year_input' && value > currentYear) {
      error = 'Year cannot be in the future.';
    }

    setErrors(prev => ({ ...prev, [id]: error }));
    onAnswer(id, value);
  };

  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  if (visibleQuestions.length === 0) {
      return <div className="text-muted-foreground text-sm italic">No details required based on your clear selection.</div>
  }

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => {
        const key = q.id;
        const error = errors[key];
        switch (q.type) {
          case 'select':
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <Select onValueChange={(value) => onAnswer(key, value)} value={answers[key] || ""}>
                  <SelectTrigger id={key}><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt: string | {value: string, label: string}) => {
                      if(typeof opt === 'object'){
                        return <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      }
                      return <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          case 'radio':
               return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <Select onValueChange={(value) => onAnswer(key, value)} value={answers[key] || ""}>
                  <SelectTrigger id={key}><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt: string | {value: string, label: string}) => {
                      if(typeof opt === 'object'){
                        return <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      }
                      return <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          case 'year_input':
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <YearInput id={key} value={answers[key]} onChange={(val) => handleValidatedChange(key, val, 'year_input')} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'text_input':
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <Input id={key} value={answers[key] || ""} onChange={(e) => handleValidatedChange(key, e.target.value)} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'number_input':
             return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <Input type="number" id={key} value={answers[key] || ""} onChange={(e) => handleValidatedChange(key, e.target.value)} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'checkbox_group':
            return (
              <div key={key} className="space-y-2">
                <Label>{q.text}</Label>
                <CheckboxGroup
                  options={q.options}
                  value={answers[key] ? JSON.parse(answers[key]) : []}
                  onChange={(val) => onAnswer(key, JSON.stringify(val))}
                  exclusiveOption={q.exclusiveOptionId}
                />
              </div>
            );
          case 'file_upload':
            return (
              <FileUploadComponent key={key} question={q} answers={answers} onAnswer={onAnswer} />
            )
          case 'consent_checkbox':
            return (
              <div key={key} className="flex items-start space-x-3 rounded-md border p-4 mt-4">
                <Checkbox
                  id={key}
                  checked={answers[key] === "true"}
                  onCheckedChange={(checked) => onAnswer(key, checked ? "true" : "false")}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor={key} className="text-sm leading-snug text-muted-foreground">
                    {q.text}
                  </label>
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
