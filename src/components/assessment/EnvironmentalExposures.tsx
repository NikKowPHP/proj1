import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

interface EnvironmentalExposuresProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

export const EnvironmentalExposures = ({ answers, onAnswer, questions }: EnvironmentalExposuresProps) => {
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
                {q.options.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {q.type === 'number_input' && (
             <Input
                id={q.id}
                type="number"
                value={answers[q.id] || ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
              />
          )}
           {q.type === 'text_input' && (
             <Input
                id={q.id}
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
              />
          )}
        </div>
      ))}
    </div>
  );
};
