import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface EnvironmentalExposuresProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  
  // Support for object-based dependsOn with operator
  if (typeof question.dependsOn === 'object' && question.dependsOn.operator) {
      const { questionId, operator, value } = question.dependsOn;
      const dependencyAnswer = answers[questionId];
      
      if (!dependencyAnswer) return false;

      if (operator === 'array_contains') {
          // Check if the dependency answer (which should be a JSON array string) contains the value
          try {
              const parsed = JSON.parse(dependencyAnswer);
              return Array.isArray(parsed) && parsed.includes(value);
          } catch (e) {
              return false;
          }
      }
      // Add other operators if needed, currently only array_contains is required for this refactor
      return false;
  }

  // Legacy simple dependency handling
  const dependencyAnswer = answers[question.dependsOn.questionId];

  if (question.dependsOn.value === true) {
     // Handle dependency on a checkbox group having any value
     return !!dependencyAnswer && dependencyAnswer !== '[]' && dependencyAnswer !== 'false';
  }
  
  return dependencyAnswer === question.dependsOn.value;
};


export const EnvironmentalExposures = ({ answers, onAnswer, questions }: EnvironmentalExposuresProps) => {
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
          {q.type === 'year_input' && (
             <YearInput
                id={q.id}
                value={answers[q.id]}
                onChange={(val) => onAnswer(q.id, val ? String(val) : '')}
                placeholder={q.placeholder}
              />
          )}
          {q.type === 'checkbox_group' && (
            <CheckboxGroup
              options={q.options}
              value={answers[q.id] ? JSON.parse(answers[q.id]) : []}
              onChange={(selected) => onAnswer(q.id, JSON.stringify(selected))}
              exclusiveOption={q.exclusiveOptionId}
            />
          )}
           {q.type === 'grouped_input' && (
             <div className="flex gap-2">
                <Input
                    id={q.id}
                    type="number"
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="flex-grow"
                />
                 <Select onValueChange={(value) => onAnswer(q.options.unitQuestionId, value)} value={answers[q.options.unitQuestionId] || ""}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.units.map((opt: string) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};
      