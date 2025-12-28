import { AlertTriangle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import React from 'react';

export interface SafetyBannerProps {
    answers: Record<string, any>;
    symptomOptions?: any[];
}

export const SafetyBanner = ({ answers, symptomOptions = [] }: SafetyBannerProps) => {
    const t = useTranslations('AssessmentPage');
    const tTriage = useTranslations('AssessmentPage.triage');
    const locale = useLocale();

    // Only these are truly Emergency (immediate 112/999). All others are Urgent (fast-track referral).
    // Abdominal pain (HP:0002027) is Urgent per source of truth, so it is NOT in this list.
    const EMERGENCY_IDS = ['HP:0001250', 'HP:0001324'];

    if (!answers.symptoms) return null;

    let selectedSymptoms: string[] = [];
    try {
        selectedSymptoms = JSON.parse(answers.symptoms);
    } catch (e) {
        return null;
    }

    // Filter logic
    const redFlagIds = symptomOptions.filter((opt: any) => opt.red_flag).map((opt: any) => opt.id);
    const detectedRedFlags = selectedSymptoms.filter(id => redFlagIds.includes(id));

    if (detectedRedFlags.length === 0) return null;

    // Determine max severity
    const hasEmergency = detectedRedFlags.some(id => EMERGENCY_IDS.includes(id));
    const bgClass = hasEmergency ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400" : "bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400";
    const iconColor = hasEmergency ? "text-red-500" : "text-yellow-500";
    const alertTitle = hasEmergency ? (locale === 'pl' ? "UWAGA: WYMAGANA NATYCHMIASTOWA POMOC" : "WARNING: IMMEDIATE CARE REQUIRED") : t('safetyBannerTitle');

    return (
        <div className={`${bgClass} border-l-4 p-4 mb-4 rounded-r`} role="alert">
            <div className="flex">
                <div className="py-1">
                    <AlertTriangle className={`h-6 w-6 ${iconColor} mr-4`} />
                </div>
                <div>
                    <p className="font-bold">{alertTitle}</p>
                    <p className="text-sm mb-2">{t('safetyBannerContent')}</p>
                    <ul className="list-disc pl-5 space-y-1">
                        {detectedRedFlags.map(id => {
                            // Try to get translation, fallback to generic if key missing (though all should be present)
                            let msg = tTriage('fallback');
                            try {
                                msg = tTriage(id as any);
                                // If the key renders exactly as the ID (common i18n fallback behavior), use general fallback
                                if (msg === id) msg = tTriage('fallback');
                            } catch (e) {
                                // key missing
                            }

                            return (
                                <li key={id} className="text-sm font-semibold">
                                    {msg}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};
