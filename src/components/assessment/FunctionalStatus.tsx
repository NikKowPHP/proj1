import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

interface FunctionalStatusProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
  errors?: Record<string, string | undefined>;
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};

export const FunctionalStatus = ({ answers, onAnswer, questions, errors }: FunctionalStatusProps) => {
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2 animate-fade-in">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
            <>
              <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                <SelectTrigger id={q.id} className={errors?.[q.id] ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt: { value: string, label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </>
          )}
          {q.type === 'checkbox' && (
            <div className="flex items-start space-x-3  border p-4">
              <Checkbox
                id={q.id}
                checked={answers[q.id] === 'true'}
                onCheckedChange={(checked) => onAnswer(q.id, checked ? 'true' : 'false')}
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor={q.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {q.checkboxLabel}
                </label>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
