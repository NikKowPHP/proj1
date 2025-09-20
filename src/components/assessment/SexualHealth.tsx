import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface SexualHealthProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};


export const SexualHealth = ({ answers, onAnswer, questions }: SexualHealthProps) => {
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>{q.text}</Label>
          {q.type === 'select' && (
             <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
              <SelectTrigger id={q.id}>
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
          )}
           {q.type === 'checkbox_group' && (
            <CheckboxGroup
              options={q.options}
              value={answers[q.id] ? JSON.parse(answers[q.id]) : []}
              onChange={(selected) => onAnswer(q.id, JSON.stringify(selected))}
              exclusiveOption={q.exclusiveOptionId}
            />
          )}
        </div>
      ))}
    </div>
  );
};
      