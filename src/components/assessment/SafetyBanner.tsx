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
    // Unexplained weight loss: HP:0004355
    // Hoarseness: HP:0001609
    // Persistent cough: HP:0002118
    // Skin changes (mole): HP:0000989
    
    const redFlags = [
        'HP:0002860', 'HP:0002027', 'HP:0000132', 'HP:0000868', 
        'HP:0003002', 'HP:0002015', 'HP:0004355', 'HP:0001609', 
        'HP:0002118', 'HP:0000989'
    ];

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

    if (!hasRedFlag) return null;

    return (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-300 p-4" role="alert">
            <div className="flex">
                <div className="py-1">
                    <AlertTriangle className="h-6 w-6 text-yellow-400 mr-4" />
                </div>
                <div>
                    <p className="font-bold">{t('safetyBannerTitle')}</p>
                    <p className="text-sm">{t('safetyBannerContent')}</p>
                </div>
            </div>
        </div>
    );
};
