import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface GeneticsProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[]; // Simplified for brevity
}

export const Genetics = ({ answers, onAnswer, questions }: GeneticsProps) => {
  const t = useTranslations("AssessmentPage");

  const getQuestion = (id: string) => questions.find(q => q.id === id);

  return (
    <div className="space-y-6">
      {questions.map(q => {
        if (q.type === 'select') {
          return (
             <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id}>{q.text}</Label>
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
            </div>
          )
        }
        if (q.type === 'consent_checkbox') {
           return (
            <div key={q.id} className="flex items-start space-x-3 rounded-md border p-4 mt-4">
              <Checkbox
                id={q.id}
                checked={answers[q.id] === "true"}
                onCheckedChange={(checked) => onAnswer(q.id, checked ? "true" : "false")}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={q.id}
                  className="text-sm leading-snug text-muted-foreground"
                >
                  {t.rich("consentGenetics", {
                    privacyLink: (chunks) => (
                      <Link
                        href="/privacy"
                        className="font-semibold text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </label>
              </div>
            </div>
           )
        }
        return null;
      })}
    </div>
  )
}
