import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface SafetyBannerProps {
    answers: Record<string, any>;
}

export const SafetyBanner = ({ answers }: SafetyBannerProps) => {
    const t = useTranslations('AssessmentPage');

    // Red Flag Symptoms IDs (based on PDF) mapped to HP codes from assessment-questions.json
    // Hemoptysis: HP:0002860
    // Melena: HP:0002027
    // Hematuria: HP:0000132
    // Postmenopausal bleeding: HP:0000868
    // Breast lump: HP:0003002
    // Dysphagia: HP:0002015
    // Unexplained weight loss: HP:0001824 (Corrected from previous HP:0004355)
    // Hoarseness: HP:0001609
    // Persistent cough: HP:0002118
    // Skin changes (mole): HP:0000989
    // Night sweats: HP:0030166
    // Bone pain: HP:0002653
    // New seizures: HP:0001250
    // Back pain with nerve symptoms: HP:0003418

    const redFlags = [
        'HP:0002860', 'HP:0002027', 'HP:0000132', 'HP:0033840',
        'HP:0003002', 'HP:0002015', 'HP:0001824', 'HP:0001609',
        'HP:0002118', 'HP:0000989', 'HP:0030166', 'HP:0002653',
        'HP:0001250', 'HP:0003418', 'HP:0000790', 'HP:0002573'
    ];

    const triageMessages: Record<string, { en: string, pl: string }> = {
        'HP:0033840': { en: "Urgent: 2-week fast-track Gyn referral recommended.", pl: "Pilne: Zalecane skierowanie do ginekologa (ścieżka onkologiczna, <2 tyg.)." },
        'HP:0002015': { en: "Urgent: Endoscopy within 2 weeks recommended.", pl: "Pilne: Zalecana gastroskopia w ciągu 2 tygodni." },
        'HP:0000790': { en: "Urgent: Urology referral pathway recommended.", pl: "Pilne: Zalecana diagnostyka urologiczna." },
        'HP:0002105': { en: "Urgent: Chest assessment recommended.", pl: "Pilne: Zalecana diagnostyka klatki piersiowej." },
        'HP:0002573': { en: "Urgent: Colorectal pathway referral recommended.", pl: "Pilne: Zalecana diagnostyka w kierunku raka jelita grubego." },
        'HP:0001824': { en: "Urgent: Evaluation for unexplained weight loss recommended.", pl: "Pilne: Zalecana diagnostyka utraty masy ciała." },
    };

    // Check if any red flag is present in 'symptoms' array
    // 'symptoms' is usually stored as a JSON string of array of IDs
    let hasRedFlag = false;
    if (answers.symptoms) {
        try {
            const symptoms = JSON.parse(answers.symptoms);
            if (Array.isArray(symptoms)) {
                hasRedFlag = symptoms.some((s: string) => redFlags.includes(s));
            }
        } catch (e) {
            // ignore parse error
        }
    }

    const detectedSymptoms = hasRedFlag && answers.symptoms ? (JSON.parse(answers.symptoms) as string[]).filter(id => redFlags.includes(id)) : [];

    if (!hasRedFlag) return null;

    return (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-300 p-4" role="alert">
            <div className="flex">
                <div className="py-1">
                    <AlertTriangle className="h-6 w-6 text-yellow-400 mr-4" />
                </div>
                <div>
                    <p className="font-bold">{t('safetyBannerTitle')}</p>
                    <p className="text-sm mb-2">{t('safetyBannerContent')}</p>
                    {detectedSymptoms.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1">
                            {detectedSymptoms.map(id => {
                                const msg = triageMessages[id];
                                if (!msg) return null;
                                // Simple locale check or use Translation hooks properly if possible. 
                                // Assuming 't' is for static keys. We use dynamic text here.
                                return (
                                    <li key={id} className="text-sm font-semibold">
                                        {/* @ts-ignore - dirty locale access */}
                                        {msg[typeof window !== 'undefined' && window.location.pathname.startsWith('/pl') ? 'pl' : 'en'] || msg.en}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
