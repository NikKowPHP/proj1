import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';

interface ScreeningHistoryProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};

export const ScreeningHistory = ({ answers, onAnswer, questions }: ScreeningHistoryProps) => {
  return (
    <div className="space-y-6">
      {questions.map(q => {
        const lastScreeningAnswer = answers[q.id];
        const lastScreeningYearId = `last_${q.id}_year`;

        const showYearInput = isVisible(q, answers) && lastScreeningAnswer === 'Yes';
        
        return (
          <div key={q.id} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
            <div className="space-y-2">
              <Label htmlFor={q.id}>{q.text}</Label>
              <Select onValueChange={(value) => onAnswer(q.id, value)} value={lastScreeningAnswer || ""}>
                <SelectTrigger id={q.id}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showYearInput && (
              <div className="space-y-2 pl-4">
                <Label htmlFor={lastScreeningYearId}>Year of last screening</Label>
                <YearInput
                  id={lastScreeningYearId}
                  value={answers[lastScreeningYearId]}
                  onChange={(val) => onAnswer(lastScreeningYearId, val ? String(val) : "")}
                  placeholder="e.g. 2022"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
