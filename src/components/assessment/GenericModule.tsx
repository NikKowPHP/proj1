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
import { Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

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
        
        const renderInfoCard = () => {
            if (!q.infoCard) return null;
            const infoText = typeof q.infoCard.text === 'object' ? q.infoCard.text.en : q.infoCard.text; // Default to EN if no locale context passed, or handle in parent
            // Ideally we pass locale to GenericModule or use useTranslations if keys are there.
            // Assuming the JSON structure has localized strings directly for now or we rely on parent to pass localized.
            // The current JSON structure has {en: "...", pl: "..."}. 
            // We need to pick the right one. But GenericModule doesn't know locale easily without props.
            // Let's assume the passed 'questions' prop already has the correct localized string if processed by API,
            // OR we handle the object here.
            // The API /api/questionnaire handles localization. So q.infoCard.text should be a string.
            
            return (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mt-2">
                    <CardContent className="p-3 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">{infoText}</p>
                    </CardContent>
                </Card>
            );
        };

        const renderInput = () => {
            switch (q.type) {
            case 'select':
                return (
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
                );
            case 'radio':
                return (
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
                );
            case 'year_input':
                return (
                <>
                    <YearInput id={key} value={answers[key]} onChange={(val) => handleValidatedChange(key, val, 'year_input')} aria-invalid={!!error} />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </>
                );
            case 'text_input':
                return (
                <>
                    <Input id={key} value={answers[key] || ""} onChange={(e) => handleValidatedChange(key, e.target.value)} aria-invalid={!!error} />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </>
                );
            case 'number_input':
                return (
                <>
                    <div className="flex items-center space-x-2">
                    <button
                            type="button"
                            onClick={() => {
                                const val = Number(answers[key] || 0);
                                handleValidatedChange(key, Math.max(0, val - 1));
                            }}
                            className="h-10 w-10 flex items-center justify-center rounded-md border bg-muted hover:bg-muted/80"
                        >
                            -
                        </button>
                        <Input 
                            type="number" 
                            inputMode="decimal"
                            id={key} 
                            value={answers[key] || ""} 
                            onChange={(e) => handleValidatedChange(key, e.target.value)} 
                            aria-invalid={!!error} 
                            className="text-center"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const val = Number(answers[key] || 0);
                                handleValidatedChange(key, val + 1);
                            }}
                            className="h-10 w-10 flex items-center justify-center rounded-md border bg-muted hover:bg-muted/80"
                        >
                            +
                        </button>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </>
                );
            case 'checkbox_group':
                return (
                <CheckboxGroup
                    options={q.options}
                    value={answers[key] ? JSON.parse(answers[key]) : []}
                    onChange={(val) => onAnswer(key, JSON.stringify(val))}
                    exclusiveOption={q.exclusiveOptionId}
                />
                );
            case 'file_upload':
                return <FileUploadComponent key={key} question={q} answers={answers} onAnswer={onAnswer} />;
            case 'consent_checkbox':
                return (
                <div className="flex items-start space-x-3 rounded-md border p-4 mt-4">
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
        };

        return (
            <div key={key} className="space-y-2">
                {q.type !== 'consent_checkbox' && <Label htmlFor={key}>{q.text}</Label>}
                {renderInput()}
                {renderInfoCard()}
            </div>
        );
      })}
    </div>
  );
};
      