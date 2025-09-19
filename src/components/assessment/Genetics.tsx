import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { Button } from '../ui/button';
import Spinner from '../ui/Spinner';
import { Paperclip, Trash2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { FileUploadComponent } from './FileUpload';

interface GeneticsProps {
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
  questions: any[]; // Simplified for brevity
}

const isVisible = (question: any, answers: Record<string, string>): boolean => {
  if (!question.dependsOn) return true;
  const dependencyAnswer = answers[question.dependsOn.questionId];
  return dependencyAnswer === question.dependsOn.value;
};


export const Genetics = ({ answers, onAnswer, questions }: GeneticsProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleValidatedChange = (id: string, value: any) => {
    let error: string | undefined = undefined;
    const currentYear = new Date().getFullYear();

    if (id === 'genetic_test_year' && value > currentYear) {
      error = 'Year cannot be in the future.';
    } else if (id === 'genetic_variants_hgvs' && value && !/^(c|p)\..+>.+$/.test(value)) {
      error = 'Please enter a valid HGVS format (e.g., c.123A>G).';
    }

    setErrors(prev => ({ ...prev, [id]: error }));
    onAnswer(id, value);
  };

  const visibleQuestions = questions.filter(q => isVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => {
        const key = q.id;
        const error = errors[key];
        switch (q.type) {
          case 'select':
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <Select onValueChange={(value) => onAnswer(key, value)} value={answers[key] || ""}>
                  <SelectTrigger id={key}><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          case 'year_input':
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <YearInput id={key} value={answers[key]} onChange={(val) => handleValidatedChange(key, val)} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'text_input':
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{q.text}</Label>
                <Input id={key} value={answers[key] || ""} onChange={(e) => handleValidatedChange(key, e.target.value)} aria-invalid={!!error} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          case 'checkbox_group': // for genes
            return (
              <div key={key} className="space-y-2">
                <Label>{q.text}</Label>
                <CheckboxGroup
                  options={q.options}
                  value={answers[key] || []}
                  onChange={(val) => onAnswer(key, val)}
                />
              </div>
            );
          case 'file_upload':
            return (
              <FileUploadComponent key={key} question={q} answers={answers} onAnswer={onAnswer} />
            )
          case 'consent_checkbox':
            return (
              <div key={key} className="flex items-start space-x-3 rounded-md border p-4 mt-4">
                <Checkbox
                  id={key}
                  checked={answers[key] === "true"}
                  onCheckedChange={(checked) => onAnswer(key, checked ? "true" : "false")}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor={key} className="text-sm leading-snug text-muted-foreground">
                    {t.rich("consentGenetics", {
                      privacyLink: (chunks) => (
                        <Link href="/privacy" className="font-semibold text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                          {chunks}
                        </Link>
                      ),
                    })}
                  </label>
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
      