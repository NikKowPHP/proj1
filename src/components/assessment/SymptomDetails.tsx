import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';
import { YearInput } from '../ui/YearInput';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Symptom {
  id: string;
  label: string;
}

interface SymptomDetailsValue {
  code?: string; // HPO code
  onset_year?: number;
  onset_month?: string;
  severity?: number;
  frequency?: string;
  progression?: string;
  associated_features?: string[];
  notes?: string;
}

interface SymptomDetailsProps {
  selectedSymptoms: Symptom[];
  value: Record<string, SymptomDetailsValue>;
  onChange: (symptomId: string, details: SymptomDetailsValue) => void;
  symptomOptions: SearchableSelectOption[];
  featureOptions: { id: string, label: string }[];
  errors?: Record<string, string | undefined>;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const SymptomDetails = ({ selectedSymptoms, value, onChange, symptomOptions, featureOptions, errors }: SymptomDetailsProps) => {

  const t = useTranslations('AssessmentPage');
  const locale = useLocale();

  const handleDetailChange = (symptomId: string, field: keyof SymptomDetailsValue, fieldValue: any) => {
    const currentDetails = value[symptomId] || {};
    onChange(symptomId, { ...currentDetails, [field]: fieldValue });
  };

  const handleFeatureToggle = (symptomId: string, featureId: string) => {
    const currentDetails = value[symptomId] || {};
    const currentFeatures = currentDetails.associated_features || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(id => id !== featureId)
      : [...currentFeatures, featureId];
    onChange(symptomId, { ...currentDetails, associated_features: newFeatures });
  };

  if (selectedSymptoms.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t('symptomDetails.noSymptoms')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {selectedSymptoms.map(symptom => (
        <Card key={symptom.id} className="animate-fade-in">
          <CardHeader>
            <SearchableSelect
              value={value[symptom.id]?.code || symptom.id}
              onChange={(val) => handleDetailChange(symptom.id, 'code', val)}
              options={symptomOptions}
              placeholder={t('symptomDetails.searchPlaceholder')}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('symptomDetails.whenStart')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={value[symptom.id]?.onset_month}
                  onValueChange={(val) => handleDetailChange(symptom.id, 'onset_month', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('symptomDetails.monthPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, i) => (
                      <SelectItem key={month} value={String(i + 1)}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <YearInput
                  value={value[symptom.id]?.onset_year}
                  onChange={(val) => handleDetailChange(symptom.id, 'onset_year', val)}
                  placeholder={t('symptomDetails.yearPlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('symptomDetails.severityLabel')}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[value[symptom.id]?.severity || 0]}
                  onValueChange={([val]) => handleDetailChange(symptom.id, 'severity', val)}
                  min={0}
                  max={10}
                  step={1}
                />
                <span className="font-bold w-8 text-center">{value[symptom.id]?.severity || 0}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('symptomDetails.frequencyLabel')}</Label>
              <Select
                value={value[symptom.id]?.frequency}
                onValueChange={(val) => handleDetailChange(symptom.id, 'frequency', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('symptomDetails.frequencyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('symptomDetails.frequencyDaily')}</SelectItem>
                  <SelectItem value="weekly">{t('symptomDetails.frequencyWeekly')}</SelectItem>
                  <SelectItem value="constant">{t('symptomDetails.frequencyConstant')}</SelectItem>
                  <SelectItem value="intermittent">{t('symptomDetails.frequencyIntermittent')}</SelectItem>
                  <SelectItem value="worsening">{t('symptomDetails.frequencyWorsening')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('symptomDetails.progressionLabel')}</Label>
              <div className="flex space-x-2">
                {[
                  { val: 'Yes', label: t('symptomDetails.progressionYes') },
                  { val: 'No', label: t('symptomDetails.progressionNo') }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleDetailChange(symptom.id, 'progression', opt.val)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium transition-colors border rounded-md flex-1",
                      value[symptom.id]?.progression === opt.val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground hover:bg-muted border-input"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('symptomDetails.associatedFeatures')}</Label>
              <div className="flex flex-wrap gap-2">
                {featureOptions.map(feature => (
                  <Chip
                    key={feature.id}
                    variant="selectable"
                    selected={(value[symptom.id]?.associated_features || []).includes(feature.id)}
                    onClick={() => handleFeatureToggle(symptom.id, feature.id)}
                  >
                    {feature.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('symptomDetails.notesLabel')}</Label>
              <textarea
                className="flex min-h-[80px] w-full  border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={value[symptom.id]?.notes || ""}
                onChange={(e) => handleDetailChange(symptom.id, 'notes', e.target.value)}
                placeholder={t('symptomDetails.notesPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
