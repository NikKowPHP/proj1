import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';

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
          {q.id === 'smoking.intensity' && (
             <div className="mb-2">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    20 cigarettes = 1 pack
                </span>
             </div>
          )}
          {q.type === 'year_input' ? (
             <YearInput
              id={q.id}
              value={answers[q.id]}
              onChange={(val) => onAnswer(q.id, val ? String(val) : '')}
              placeholder={q.placeholder}
            />
          ) : q.type === 'date_input' ? (
            <Input
              id={q.id}
              type="date"
              value={answers[q.id] || ""}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder={q.placeholder}
            />
          ) : (
            <Input
              id={q.id}
              type="number"
              value={answers[q.id] || ""}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder={q.placeholder}
              min="0"
            />
          )}
        </div>
      ))}
    </div>
  );
};
        