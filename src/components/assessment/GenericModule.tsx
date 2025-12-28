'use client'

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { FileUploadComponent } from './FileUpload';
import { Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { isQuestionVisible } from '@/lib/utils/question-visibility';

interface GenericModuleProps {
    answers: Record<string, any>;
    onAnswer: (id: string, value: any) => void;
    questions: any[];
    errors?: Record<string, string | undefined>;
}

export const GenericModule = ({ answers, onAnswer, questions, errors: externalErrors }: GenericModuleProps) => {
    const t = useTranslations("AssessmentPage");
    const locale = useLocale();
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    const getLabel = (label: any) => {
        // The API already localizes the response, so label should be a string.
        // We keep the object check for safety if raw JSON is ever passed directly.
        if (typeof label === 'object' && label !== null) {
            return label[locale] || label.en || Object.values(label)[0];
        }
        return label;
    };

    const handleValidatedChange = (id: string, value: any, type?: string) => {
        let error: string | undefined = undefined;
        const currentYear = new Date().getFullYear();

        if (type === 'year_input' && value > currentYear) {
            error = 'Year cannot be in the future.';
        }
        if (type === 'month_year_input' && value) {
            const y = parseInt(value.toString().split('-')[0]);
            if (y > currentYear) error = 'Year cannot be in the future.';
        }

        setErrors(prev => ({ ...prev, [id]: error }));
        onAnswer(id, value);
    };

    const visibleQuestions = questions.filter(q => isQuestionVisible(q, answers));

    if (visibleQuestions.length === 0) {
        return <div className="text-muted-foreground text-sm italic">No details required based on your clear selection.</div>
    }

    return (
        <div className="space-y-6">
            {visibleQuestions.map(q => {
                const key = q.id;
                const error = errors[key] || externalErrors?.[key];
                const questionText = getLabel(q.text);

                const renderInfoCard = () => {
                    if (!q.infoCard) return null;
                    const infoText = getLabel(q.infoCard.text);

                    return (
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mt-2">
                            <CardContent className="p-3 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700 dark:text-blue-300">{infoText}</p>
                            </CardContent>
                        </Card>
                    );
                };

                const renderInput = () => {
                    switch (q.type) {
                        case 'select':
                        case 'radio': // Fallback to select for simple radio lists in generic module
                            return (
                                <Select onValueChange={(value) => onAnswer(key, value)} value={answers[key] || ""}>
                                    <SelectTrigger id={key}><SelectValue placeholder={locale === 'pl' ? "Wybierz opcję" : "Select an option"} /></SelectTrigger>
                                    <SelectContent>
                                        {q.options.map((opt: string | { value: string, label: any }) => {
                                            const value = typeof opt === 'object' ? opt.value : opt;
                                            const label = typeof opt === 'object' ? getLabel(opt.label) : opt;
                                            return <SelectItem key={value} value={value}>{label}</SelectItem>
                                        })}
                                    </SelectContent>
                                </Select>
                            );
                        case 'year_input':
                            return (
                                <>
                                    <YearInput id={key} value={answers[key]} onChange={(val) => handleValidatedChange(key, val, 'year_input')} aria-invalid={!!error} />
                                    {error && <p className="text-sm text-destructive">{error}</p>}
                                </>
                            );
                        case 'text_input':
                            return (
                                <>
                                    <Input id={key} value={answers[key] || ""} onChange={(e) => handleValidatedChange(key, e.target.value)} aria-invalid={!!error} />
                                    {error && <p className="text-sm text-destructive">{error}</p>}
                                </>
                            );
                        case 'number_input':
                            return (
                                <>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = Number(answers[key] || 0);
                                                const step = q.step || 1;
                                                handleValidatedChange(key, Math.max(0, val - step));
                                            }}
                                            className="h-10 w-10 flex items-center justify-center  border bg-muted hover:bg-muted/80"
                                        >
                                            -
                                        </button>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            step={q.step || 1}
                                            id={key}
                                            value={answers[key] || ""}
                                            onChange={(e) => handleValidatedChange(key, e.target.value)}
                                            aria-invalid={!!error}
                                            className="text-center"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = Number(answers[key] || 0);
                                                const step = q.step || 1;
                                                handleValidatedChange(key, val + step);
                                            }}
                                            className="h-10 w-10 flex items-center justify-center  border bg-muted hover:bg-muted/80"
                                        >
                                            +
                                        </button>
                                    </div>
                                    {error && <p className="text-sm text-destructive">{error}</p>}
                                </>
                            );
                        case 'month_year_input':
                            const [yearStr, monthStr] = (answers[key] || "").split('-');
                            const months = [
                                { value: '01', label: locale === 'pl' ? 'Styczeń' : 'January' },
                                { value: '02', label: locale === 'pl' ? 'Luty' : 'February' },
                                { value: '03', label: locale === 'pl' ? 'Marzec' : 'March' },
                                { value: '04', label: locale === 'pl' ? 'Kwiecień' : 'April' },
                                { value: '05', label: locale === 'pl' ? 'Maj' : 'May' },
                                { value: '06', label: locale === 'pl' ? 'Czerwiec' : 'June' },
                                { value: '07', label: locale === 'pl' ? 'Lipiec' : 'July' },
                                { value: '08', label: locale === 'pl' ? 'Sierpień' : 'August' },
                                { value: '09', label: locale === 'pl' ? 'Wrzesień' : 'September' },
                                { value: '10', label: locale === 'pl' ? 'Październik' : 'October' },
                                { value: '11', label: locale === 'pl' ? 'Listopad' : 'November' },
                                { value: '12', label: locale === 'pl' ? 'Grudzień' : 'December' }
                            ];

                            const handleMonthYearChange = (newYear: string | undefined, newMonth: string | undefined) => {
                                const y = newYear !== undefined ? newYear : (yearStr || '');
                                const m = newMonth !== undefined ? newMonth : (monthStr || '');

                                if (y || m) {
                                    const val = m ? `${y}-${m}` : y;
                                    handleValidatedChange(key, val, 'month_year_input');
                                } else {
                                    onAnswer(key, undefined);
                                }
                            };

                            return (
                                <div className="flex gap-2">
                                    <div className="w-1/3 min-w-[120px]">
                                        <Select value={monthStr || ""} onValueChange={(val) => handleMonthYearChange(undefined, val)}>
                                            <SelectTrigger><SelectValue placeholder={locale === 'pl' ? "Miesiąc" : "Month"} /></SelectTrigger>
                                            <SelectContent>
                                                {months.map(m => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-1/3 min-w-[100px]">
                                        <YearInput
                                            value={yearStr ? parseInt(yearStr) : undefined}
                                            onChange={(val) => handleMonthYearChange(val?.toString(), undefined)}
                                            placeholder={locale === 'pl' ? "Rok" : "Year"}
                                        />
                                    </div>
                                </div>
                            );
                        case 'checkbox_group':
                            return (
                                <CheckboxGroup
                                    options={q.options.map((opt: any) => ({
                                        ...opt,
                                        label: getLabel(opt.label || opt)
                                    }))}
                                    value={answers[key] ? JSON.parse(answers[key]) : []}
                                    onChange={(val) => onAnswer(key, JSON.stringify(val))}
                                    exclusiveOption={q.exclusiveOptionId}
                                    idPrefix={key}
                                />
                            );
                        case 'file_upload':
                            return <FileUploadComponent key={key} question={{ ...q, text: questionText }} answers={answers} onAnswer={onAnswer} />;
                        case 'consent_checkbox':
                            return (
                                <div className="flex items-start space-x-3  border p-4 mt-4">
                                    <Checkbox
                                        id={key}
                                        checked={answers[key] === "true"}
                                        onCheckedChange={(checked) => onAnswer(key, checked ? "true" : "false")}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor={key} className="text-sm leading-snug text-muted-foreground">
                                            {questionText}
                                        </label>
                                    </div>
                                </div>
                            );
                        default:
                            return null;
                    }
                };

                return (
                    <div key={key} className="space-y-2 animate-fade-in">
                        {q.type !== 'consent_checkbox' && <Label htmlFor={key}>{questionText}</Label>}
                        {renderInput()}
                        {renderInfoCard()}
                    </div>
                );
            })}
        </div>
    );
};
