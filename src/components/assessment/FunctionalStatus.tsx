import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface FunctionalStatusProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

export const FunctionalStatus = ({ answers, onAnswer, questions }: FunctionalStatusProps) => {
  return (
    <div className="space-y-6">
      {questions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
            <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
              <SelectTrigger id={q.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((opt: {value: string, label: string}) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
};
