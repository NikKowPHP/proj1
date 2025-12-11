import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

interface MedicationsProps {
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

export const Medications = ({ answers, onAnswer, questions, errors }: MedicationsProps) => {
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
                  {q.options.map((opt: { value: string, label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </>
          )}
          {q.type === 'text_input' && (
            <>
              <Input
                id={q.id}
                value={answers[q.id] || ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
                className={errors?.[q.id] ? "border-destructive" : ""}
              />
              {errors?.[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  );
};
