'use client'

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ScreeningQuestion {
  id: string;
  text: string;
  type: 'select' | 'year_input';
  options?: {value: string, label: string}[];
  dependsOn?: {
    questionId: string;
    value: string;
  };
}

interface ScreeningGroup {
  id: string;
  text: string;
  questions: ScreeningQuestion[];
  dependsOn?: {
    questionId: string;
    value: string;
  };
}

interface ImmunizationQuestion {
  id: string;
  text: string;
  type: 'select';
  options?: {value: string, label: string}[];
}

interface ScreeningHistoryProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  screeningGroups: ScreeningGroup[];
  immunizationQuestions: ImmunizationQuestion[];
}

// A generic visibility check for any object with a `dependsOn` property.
const isVisible = (
  item: { dependsOn?: { questionId: string; value: string } },
  answers: Record<string, string>,
): boolean => {
  if (!item.dependsOn) return true;
  const dependencyAnswer = answers[item.dependsOn.questionId];
  return dependencyAnswer === item.dependsOn.value;
};

export const ScreeningHistory = ({ answers, onAnswer, screeningGroups, immunizationQuestions }: ScreeningHistoryProps) => {
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
      <div>
        <h3 className="text-lg font-semibold mb-4">Screening History</h3>
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
                            {q.options?.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Immunization History</h3>
        <div className="space-y-4">
          {immunizationQuestions.map(q => (
             <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id}>{q.text}</Label>
              <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                <SelectTrigger id={q.id}><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {q.options?.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
