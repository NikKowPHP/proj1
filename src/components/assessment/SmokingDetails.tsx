import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface SmokingDetailsProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

export const SmokingDetails = ({ answers, onAnswer, questions }: SmokingDetailsProps) => {
  return (
    <div className="space-y-6">
      {questions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          <Input
            id={q.id}
            type="number"
            value={answers[q.id] || ""}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            min="0"
          />
        </div>
      ))}
    </div>
  );
};
