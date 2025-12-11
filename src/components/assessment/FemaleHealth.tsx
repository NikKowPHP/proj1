import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';

interface FemaleHealthProps {
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

export const FemaleHealth = ({ answers, onAnswer, questions, errors }: FemaleHealthProps) => {
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
            <>
              <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                <SelectTrigger id={q.id} className={errors?.[q.id] ? "border-destructive" : ""}>
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
              {errors?.[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </>
          )}
          {q.type === 'year_input' && (
            <>
              <YearInput
                id={q.id}
                value={answers[q.id]}
                onChange={(val) => onAnswer(q.id, val ? String(val) : "")}
                placeholder="e.g. 48"
                min={1}
                max={100}
                aria-invalid={!!errors?.[q.id]}
              />
              {errors?.[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  );
};
