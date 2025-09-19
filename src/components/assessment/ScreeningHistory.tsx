import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { YearInput } from '../ui/YearInput';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ScreeningQuestion {
  id: string;
  text: string;
  type: 'select' | 'year_input';
  options?: string[];
  dependsOn?: {
    questionId: string;
    value: string;
  };
}

interface ScreeningGroup {
  id: string;
  text: string;
  questions: ScreeningQuestion[];
}

interface ImmunizationQuestion {
  id: string;
  text: string;
  type: 'select';
  options?: string[];
}

interface ScreeningHistoryProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  screeningGroups: ScreeningGroup[];
  immunizationQuestions: ImmunizationQuestion[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  // Handle dependency IDs that might be nested, e.g., "screen.colonoscopy.done"
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};

export const ScreeningHistory = ({ answers, onAnswer, screeningGroups, immunizationQuestions }: ScreeningHistoryProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Screening History</h3>
        <div className="space-y-4">
          {screeningGroups.map(group => (
            <Card key={group.id}>
              <CardHeader><CardTitle>{group.text}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {group.questions.filter(q => isVisible(q, answers)).map(q => (
                  <div key={q.id} className="space-y-2">
                    <Label htmlFor={q.id}>{q.text}</Label>
                    {q.type === 'select' && (
                       <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                        <SelectTrigger id={q.id}><SelectValue placeholder="Select an option" /></SelectTrigger>
                        <SelectContent>
                          {q.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {q.type === 'year_input' && (
                       <YearInput
                        id={q.id}
                        value={answers[q.id]}
                        onChange={(val) => onAnswer(q.id, val ? String(val) : "")}
                        placeholder="e.g. 2022"
                      />
                    )}
                  </div>
                ))}
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
                  {q.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
      