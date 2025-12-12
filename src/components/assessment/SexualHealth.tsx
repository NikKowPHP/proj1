import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { useLocale } from 'next-intl';

interface SexualHealthProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[];
  errors?: Record<string, string | undefined>;
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};


export const SexualHealth = ({ answers, onAnswer, questions, errors }: SexualHealthProps) => {
  const locale = useLocale();
  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  const getOptionLabel = (opt: any) => {
    const rawLabel = typeof opt === 'object' ? opt.label : opt;
    if (typeof rawLabel === 'object' && rawLabel !== null) {
      const localized = (rawLabel as Record<string, string>)[locale as string];
      return localized ?? (rawLabel as any).en ?? Object.values(rawLabel)[0];
    }
    return rawLabel;
  };

  // Opt-in Logic
  // If opt-in question is present and answer is No/Prefer not to say, specific logic might be needed
  // But strictly, the dependsOn in JSON handles the visibility of subsequent questions.
  // The JSON update made 'sex_active' depend on 'sexhx.section_opt_in' = 'Yes'.
  // So 'visibleQuestions' already filters correctly!
  // However, we need to ensure the opt-in question itself is visible and works.

  // If the user answered "No" to opt-in, we just show that one question.
  // This is handled by 'visibleQuestions'.

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => (
        <div key={q.id} className="space-y-2">
          {/* Label handling for opt-in question which might be longer */}
          <Label htmlFor={q.id} className={q.id === 'sexhx.section_opt_in' ? "text-base font-semibold" : ""}>{q.text}</Label>
          {q.type === 'select' && (
            <>
              <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
                <SelectTrigger id={q.id} className={errors?.[q.id] ? "border-destructive" : ""}>
                  <SelectValue placeholder={locale === 'pl' ? "Wybierz opcję" : "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt: string | { value: string; label: any }) => {
                    const value = typeof opt === 'object' ? opt.value : opt;
                    const label = getOptionLabel(opt);
                    return <SelectItem key={value} value={value}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              {errors?.[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </>
          )}
          {q.type === 'checkbox_group' && (
            <CheckboxGroup
              options={q.options.map((opt: any) => ({
                ...opt,
                label: getOptionLabel(opt)
              }))}
              value={answers[q.id] ? JSON.parse(answers[q.id]) : []}
              onChange={(selected) => onAnswer(q.id, JSON.stringify(selected))}
              exclusiveOption={q.exclusiveOptionId}
              idPrefix={q.id}
            />
          )}
          {q.type === 'radio' && (
            // Fallback for radio if passed (though JSON mostly uses select for these)
            <Select onValueChange={(value) => onAnswer(q.id, value)} value={answers[q.id] || ""}>
              <SelectTrigger id={q.id}>
                <SelectValue placeholder={locale === 'pl' ? "Wybierz opcję" : "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((opt: string | { value: string; label: any }) => {
                  const value = typeof opt === 'object' ? opt.value : opt;
                  const label = getOptionLabel(opt);
                  return <SelectItem key={value} value={value}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}
          {q.type === 'number_input' && (
            <input
              type="number"
              id={q.id}
              className="flex h-10 w-full   border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={answers[q.id] || ""}
              onChange={(e) => onAnswer(q.id, e.target.value)}
            />
          )}
          {q.type === 'text_input' && (
            <input
              type="text"
              id={q.id}
              className="flex h-10 w-full   border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={answers[q.id] || ""}
              onChange={(e) => onAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
