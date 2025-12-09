'use client'

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface ScreeningQuestion {
  id: string;
  text: string;
  type: 'select' | 'year_input' | 'checkbox_group';
  options?: any[];
  dependsOn?: {
    questionId: string;
    value: string | boolean | string[];
  };
}

interface ScreeningGroup {
  id: string;
  text: string;
  questions: ScreeningQuestion[];
  dependsOn?: {
    questionId: string;
    value: string | boolean | string[];
  };
}

interface ImmunizationQuestion {
  id: string;
  text: string;
  type: 'select';
  options?: {value: string, label: string}[];
}

interface ScreeningHistoryProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  screeningGroups: ScreeningGroup[];
  immunizationQuestions: ImmunizationQuestion[];
  questions?: any[]; 
}

// A generic visibility check for any object with a `dependsOn` property.
const isVisible = (
  item: { dependsOn?: { questionId: string; value: string | boolean | string[] } },
  answers: Record<string, any>,
): boolean => {
  if (!item.dependsOn) return true;
  const dependencyAnswer = answers[item.dependsOn.questionId];

  // Handle array dependency (e.g. checkbox group) - if value is array, check inclusion
  if (Array.isArray(item.dependsOn.value)) {
     if (Array.isArray(dependencyAnswer)) {
        // Intersection? Or requires at least one match? Usually "value" in dependsOn means "if answer is one of these"
        return item.dependsOn.value.some(v => dependencyAnswer.includes(v));
     } else {
        return item.dependsOn.value.includes(dependencyAnswer);
     }
  }

  // Handle checklist dependency (if dependsOn.value is boolean 'true', check if specific ID is in list?)
  // But usually `dependsOn` structure in this codebase is simple value match.
  // We'll assume strict equality or inclusion if answer is array.
  
  if (Array.isArray(dependencyAnswer)) {
      if (typeof item.dependsOn.value === 'string') {
          return dependencyAnswer.includes(item.dependsOn.value);
      }
  }

  return dependencyAnswer === item.dependsOn.value;
};

export const ScreeningHistory = ({ answers, onAnswer, screeningGroups, immunizationQuestions, questions }: ScreeningHistoryProps) => {
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleValidatedChange = (id: string, value: string | undefined) => {
    let error: string | undefined = undefined;
    const numValue = value ? Number(value) : undefined;
    const currentYear = new Date().getFullYear();

    if (numValue && numValue > currentYear) {
      error = 'Year cannot be in the future.';
    }

    setErrors(prev => ({ ...prev, [id]: error }));
    onAnswer(id, value ? String(value) : "");
  };
  
  const visibleScreeningGroups = screeningGroups.filter(group => isVisible(group, answers));
  
  return (
    <div className="space-y-6">
      {/* Top-level questions (Checklist) */}
      {questions && questions.length > 0 && (
         <Card>
            <CardHeader><CardTitle>Screening Overview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {questions.map(q => (
                    <div key={q.id} className="space-y-2">
                        <Label>{q.text}</Label>
                        {q.type === 'checkbox_group' && (
                             <CheckboxGroup
                                options={q.options}
                                value={answers[q.id] || []}
                                onChange={(val) => onAnswer(q.id, val)}
                             />
                        )}
                    </div>
                ))}
            </CardContent>
         </Card>
      )}

      {visibleScreeningGroups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Screening Details</h3>
            <div className="space-y-4">
              {visibleScreeningGroups.map(group => (
                <Card key={group.id}>
                  <CardHeader><CardTitle>{group.text}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {group.questions.filter(q => isVisible(q, answers)).map(q => {
                      const error = errors[q.id];
                      return (
                        <div key={q.id} className="space-y-2">
                          <Label htmlFor={q.id}>{q.text}</Label>
                          {q.type === 'select' && (
                             <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                              <SelectTrigger id={q.id}><SelectValue placeholder="Select an option" /></SelectTrigger>
                              <SelectContent>
                                {q.options?.map((opt:any) => {
                                   const val = typeof opt === 'object' ? opt.value : opt;
                                   const lbl = typeof opt === 'object' ? opt.label : opt;
                                   return <SelectItem key={val} value={val}>{lbl ? (typeof lbl === 'object' ? lbl.en : lbl) : val}</SelectItem>
                                })}
                              </SelectContent>
                            </Select>
                          )}
                          {q.type === 'year_input' && (
                             <>
                              <YearInput
                                id={q.id}
                                value={answers[q.id]}
                                onChange={(val) => handleValidatedChange(q.id, val ? String(val) : "")}
                                placeholder="e.g. 2022"
                                aria-invalid={!!error}
                              />
                              {error && <p className="text-sm text-destructive">{error}</p>}
                             </>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Immunization History</h3>
        <div className="space-y-4">
          {immunizationQuestions.map(q => (
             <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id}>{q.text}</Label>
              <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                <SelectTrigger id={q.id}><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {q.options?.map((opt) => <SelectItem key={opt.value} value={opt.value}>{typeof opt.label === 'object' ? (opt.label as any).en : opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
