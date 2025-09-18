import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

export const SafetyBanner = () => {
    const t = useTranslations('AssessmentPage');
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
