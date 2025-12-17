import { AlertTriangle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import React from 'react';

export interface SafetyBannerProps {
    answers: Record<string, any>;
    symptomOptions?: any[];
}

export const SafetyBanner = ({ answers, symptomOptions = [] }: SafetyBannerProps) => {
    const t = useTranslations('AssessmentPage');
    const locale = useLocale();

    const triageMessages: Record<string, { en: string, pl: string }> = {
        'HP:0033840': { en: "Urgent: 2-week fast-track Gyn referral recommended.", pl: "Pilne: Zalecane skierowanie do ginekologa (ścieżka onkologiczna, <2 tyg.)." },
        'HP:0002027': { en: "Urgent: Significant abdominal pain requires evaluation.", pl: "Pilne: Silny ból brzucha wymaga oceny." },
        'HP:0002015': { en: "Urgent: Endoscopy within 2 weeks recommended.", pl: "Pilne: Zalecana gastroskopia w ciągu 2 tygodni." },
        'HP:0000790': { en: "Urgent: Urology referral pathway recommended.", pl: "Pilne: Zalecana diagnostyka urologiczna." },
        'HP:0002105': { en: "Urgent: Chest assessment recommended.", pl: "Pilne: Zalecana diagnostyka klatki piersiowej." },
        'HP:0012735': { en: "Urgent: Chest assessment for persistent cough recommended.", pl: "Pilne: Zalecana diagnostyka klatki piersiowej (kaszel >3 tyg.)." },
        'HP:0002573': { en: "Urgent: Colorectal pathway referral recommended.", pl: "Pilne: Zalecana diagnostyka w kierunku raka jelita grubego." },
        'HP:0001824': { en: "Urgent: Evaluation for unexplained weight loss recommended.", pl: "Pilne: Zalecana diagnostyka utraty masy ciała." },
        // Add defaults for others if needed or rely on generic message if message missing but flag is present
    };

    if (!answers.symptoms) return null;

    let selectedSymptoms: string[] = [];
    try {
        selectedSymptoms = JSON.parse(answers.symptoms);
    } catch (e) {
        return null;
    }

    // Dynamic Red Flag Detection directly from schema (prop)
    // We filter for red_flag=true in the options passed from parent
    const redFlagIds = symptomOptions.filter((opt: any) => opt.red_flag).map((opt: any) => opt.id);

    // Also include any hardcoded ones that have messages if we want to be safe, but the goal is to use the prop.
    // If symptomOptions is empty (e.g. not passed), fallback to known keys of triageMessages?
    // Let's rely on symptomOptions as primary source.

    const detectedRedFlags = selectedSymptoms.filter(id => redFlagIds.includes(id));

    if (detectedRedFlags.length === 0) return null;

    return (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-300 p-4" role="alert">
            <div className="flex">
                <div className="py-1">
                    <AlertTriangle className="h-6 w-6 text-yellow-400 mr-4" />
                </div>
                <div>
                    <p className="font-bold">{t('safetyBannerTitle')}</p>
                    <p className="text-sm mb-2">{t('safetyBannerContent')}</p>
                    <ul className="list-disc pl-5 space-y-1">
                        {detectedRedFlags.map(id => {
                            const msg = triageMessages[id];
                            return (
                                <li key={id} className="text-sm font-semibold">
                                    {msg
                                        ? (locale === 'pl' ? msg.pl : msg.en)
                                        : t('urgentEvalRequired') || "Urgent evaluation required."}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};
