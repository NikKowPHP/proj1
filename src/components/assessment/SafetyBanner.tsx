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

    const triageMessages: Record<string, { level: 'emergency' | 'urgent', en: string, pl: string }> = {
        'HP:0033840': { level: 'urgent', en: "Urgent: 2-week fast-track Gyn referral recommended.", pl: "Pilne: Zalecane skierowanie do ginekologa (ścieżka onkologiczna, <2 tyg.)." },
        'HP:0002027': { level: 'emergency', en: "Emergency: Severe abdominal pain requires immediate evaluation.", pl: "Pilne: Silny ból brzucha wymaga natychmiastowej oceny." }, // Elevated to Emergency based on "Significant" -> "Severe" context
        'HP:0002015': { level: 'urgent', en: "Urgent: Endoscopy within 2 weeks recommended.", pl: "Pilne: Zalecana gastroskopia w ciągu 2 tygodni." },
        'HP:0000790': { level: 'urgent', en: "Urgent: Urology referral pathway recommended.", pl: "Pilne: Zalecana diagnostyka urologiczna." },
        'HP:0002105': { level: 'urgent', en: "Urgent: Chest assessment recommended (Hemoptysis).", pl: "Pilne: Zalecana diagnostyka klatki piersiowej (Krwioplucie)." },
        'HP:0012735': { level: 'urgent', en: "Urgent: Chest assessment for persistent cough recommended.", pl: "Pilne: Zalecana diagnostyka klatki piersiowej (kaszel >3 tyg.)." },
        'HP:0002573': { level: 'urgent', en: "Urgent: Colorectal pathway referral recommended.", pl: "Pilne: Zalecana diagnostyka w kierunku raka jelita grubego." },
        'HP:0002249': { level: 'urgent', en: "Urgent: Colorectal pathway referral recommended (Melena).", pl: "Pilne: Zalecana diagnostyka w kierunku raka jelita grubego (Melena)." },
        'HP:0001824': { level: 'urgent', en: "Urgent: Evaluation for unexplained weight loss recommended.", pl: "Pilne: Zalecana diagnostyka utraty masy ciała." },

        // Added missing red flags
        'HP:0030166': { level: 'urgent', en: "Urgent: Evaluation for B-symptoms (Night sweats) recommended.", pl: "Pilne: Zalecana ocena objawów ogólnych (poty nocne)." },
        'HP:0002653': { level: 'urgent', en: "Urgent: Evaluation for bone pain recommended.", pl: "Pilne: Zalecana ocena bólu kości." },
        'HP:0003418': { level: 'urgent', en: "Urgent: Evaluation for nerve compression/back pain recommended.", pl: "Pilne: Zalecana ocena bólu pleców/ucisku nerbów." },
        'HP:0002315': { level: 'urgent', en: "Urgent: Neurological evaluation for new headache pattern.", pl: "Pilne: Ocena neurologiczna nowego wzorca bólu głowy." },
        'HP:0001609': { level: 'urgent', en: "Urgent: ENT evaluation for persistent hoarseness.", pl: "Pilne: Ocena Laryngologiczna (chrypka)." },
        'onkn.symptom.indigestion_alarm': { level: 'urgent', en: "Urgent: Gastroscopy for indigestion with alarm features.", pl: "Pilne: Gastroskopia (niestrawność z objawami alarmowymi)." },
        'HP:0001031': { level: 'urgent', en: "Urgent: Dermatology evaluation for changing mole.", pl: "Pilne: Ocena dermatologiczna." },
        'HP:0032408': { level: 'urgent', en: "Urgent: Breast clinic referral recommended.", pl: "Pilne: Skierowanie do poradni chorób piersi." },
        'HP:0001250': { level: 'emergency', en: "Emergency: New onset seizures require immediate care.", pl: "Nagłe: Nowe napady drgawkowe wymagają natychmiastowej pomocy." },
        'HP:0001324': { level: 'emergency', en: "Emergency: Acute focal weakness requires immediate stroke assessment.", pl: "Nagłe: Ogniskowe osłabienie wymaga natychmiastowej oceny (udar)." },
        'onkn.symptom.neuro_other': { level: 'urgent', en: "Urgent: Neurological evaluation recommended.", pl: "Pilne: Zalecana ocena neurologiczna." },

    };

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
    const hasEmergency = detectedRedFlags.some(id => triageMessages[id]?.level === 'emergency');
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
