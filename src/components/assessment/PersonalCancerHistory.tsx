'use client'

import React, { useState } from 'react';
import { RepeatingGroup } from '../ui/RepeatingGroup';
import { Label } from '../ui/label';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { YearInput } from '../ui/YearInput';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useTranslations } from 'next-intl';

interface CancerDiagnosis {
  type?: string;
  year_dx?: number;
  age_at_dx?: number;
  treatments?: string[];
  last_followup?: number;
  // New fields
  stage_group?: string; // I, II, III, IV, Not told, Don't remember
  laterality?: string; // Left, Right, Bilateral
  recurrence_ever?: string; // Yes, No, Not sure
  metastatic_ever?: string; // Yes, No, Not sure
  genetic_flag?: string; // Yes, No, Not sure
  status_current?: string; // no_evidence, in_remission, active_treatment, stable, not_sure
  surgery_type?: string; // Mastectomy, Lumpectomy

  // Radiotherapy details
  rt_region?: string[];
  rt_age_first?: number;
  rt_year_last?: number;

  // Systemic / Drug details
  sys_type?: string[];
  sys_current?: string;
  sys_year_last?: number; // Only if not current

  // Endocrine / Hormone details
  endo_indication?: string;
  endo_current?: string; // Yes/No
  endo_years_total?: number;
}

interface PersonalCancerHistoryProps {
  value: CancerDiagnosis[];
  onChange: (value: CancerDiagnosis[]) => void;
  options: {
    cancerTypes: SearchableSelectOption[];
    treatmentTypes: { id: string, label: string }[];
    stageOptions?: { value: string, label: string }[];
    lateralityOptions?: { value: string, label: string }[];
  };
  errors?: Record<string, string | undefined>;
}

export const PersonalCancerHistory = ({ value, onChange, options, errors: externalErrors }: PersonalCancerHistoryProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<number, { year_dx?: string, last_followup?: string }>>({});

  const handleAdd = () => {
    onChange([...value, { treatments: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof CancerDiagnosis, fieldValue: any) => {
    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };

    if (field === 'year_dx' || field === 'last_followup') {
      const currentYear = new Date().getFullYear();
      if (fieldValue > currentYear) {
        setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: 'Year cannot be in the future.' } }));
      } else {
        const newErrors = { ...errors[index] };
        delete newErrors[field];
        setErrors(prev => ({ ...prev, [index]: newErrors }));
      }
    }

    onChange(newValues);
  };

  return (
    <RepeatingGroup
      values={value}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel={t('addDiagnosis')}
    >
      {(item, index) => (
        <div className="space-y-4 border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0 animate-fade-in">
          <div className="space-y-2">
            <Label>{t('typeOfCancer')}</Label>
            <SearchableSelect
              value={item.type}
              onChange={(val) => handleFieldChange(index, 'type', val)}
              options={options.cancerTypes}
              placeholder="Search cancer type..."
            />
          </div>

          {item.type === 'other' && (
            <div className="space-y-2 animate-fade-in">
              <Label>{t('specifyOther') || "Specify Other Cancer"}</Label>
              <input
                type="text"
                className="flex h-10 w-full border border-input bg-background px-3"
                value={(item as any).type_other || ""}
                onChange={(e) => handleFieldChange(index, 'type_other' as any, e.target.value)}
                placeholder="e.g. Adrenal Cancer"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('yearOfDiagnosis')}</Label>
              <YearInput
                value={item.year_dx}
                onChange={(val) => handleFieldChange(index, 'year_dx', val)}
                placeholder="e.g. 2015"
                aria-invalid={!!errors[index]?.year_dx}
              />
              {errors[index]?.year_dx && <p className="text-sm text-destructive">{errors[index].year_dx}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('ageAtDiagnosisOptional')}</Label>
              <input
                type="number"
                className="flex h-10 w-full  border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={item.age_at_dx || ""}
                onChange={(e) => handleFieldChange(index, 'age_at_dx', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 45"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lastFollowUpYear')}</Label>
              <YearInput
                value={item.last_followup}
                onChange={(val) => handleFieldChange(index, 'last_followup', val)}
                placeholder="e.g. 2023"
                aria-invalid={!!errors[index]?.last_followup}
              />
              {errors[index]?.last_followup && <p className="text-sm text-destructive">{errors[index].last_followup}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('stageAtDiagnosis')}</Label>
              <Select value={item.stage_group} onValueChange={(val) => handleFieldChange(index, 'stage_group', val)}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {(options.stageOptions || []).map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                  {/* Fallback if options not passed */}
                  {!options.stageOptions && (
                    <>
                      <SelectItem value="I">Stage I</SelectItem>
                      <SelectItem value="II">Stage II</SelectItem>
                      <SelectItem value="III">Stage III</SelectItem>
                      <SelectItem value="IV">Stage IV</SelectItem>
                      <SelectItem value="Not told">Not told</SelectItem>
                      <SelectItem value="Don't remember">Don't remember</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('laterality')}</Label>
              <Select value={item.laterality} onValueChange={(val) => handleFieldChange(index, 'laterality', val)}>
                <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                <SelectContent>
                  {(options.lateralityOptions || []).map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                  {!options.lateralityOptions && (
                    <>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Right">Right</SelectItem>
                      <SelectItem value="Bilateral">Bilateral</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>{t('recurrenceEver')}</Label>
              <Select value={item.recurrence_ever} onValueChange={(val) => handleFieldChange(index, 'recurrence_ever', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Not sure">Not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('metastaticEver')}</Label>
              <Select value={item.metastatic_ever} onValueChange={(val) => handleFieldChange(index, 'metastatic_ever', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Not sure">Not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`genetic_${index}`}>{t('linkedToGenetic')}</Label>
              <Select
                value={typeof item.genetic_flag === 'boolean' ? (item.genetic_flag ? 'Yes' : 'No') : item.genetic_flag}
                onValueChange={(val) => handleFieldChange(index, 'genetic_flag', val)}
              >
                <SelectTrigger id={`genetic_${index}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Not sure">Not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('currentStatus')}</Label>
            <Select value={item.status_current} onValueChange={(val) => handleFieldChange(index, 'status_current', val)}>
              <SelectTrigger><SelectValue placeholder="Select current status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no_evidence">No evidence of disease</SelectItem>
                <SelectItem value="in_remission">In remission</SelectItem>
                <SelectItem value="active_treatment">Active treatment</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="not_sure">Not sure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <CheckboxGroup
              options={options.treatmentTypes}
              value={item.treatments || []}
              onChange={(val) => handleFieldChange(index, 'treatments', val)}
              idPrefix={`treatment_${index}`}
            />
          </div>

          {/* Granular Surgery Details (Example for Breast Cancer) */}
          {(item.treatments || []).includes('surgery') && (item.type?.toLowerCase().includes('breast')) && (
            <div className="space-y-2 animate-fade-in">
              <Label>{t('surgeryType')}</Label>
              <Select value={item.surgery_type} onValueChange={(val) => handleFieldChange(index, 'surgery_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select surgery type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mastectomy">Mastectomy (Single)</SelectItem>
                  <SelectItem value="double_mastectomy">Double Mastectomy</SelectItem>
                  <SelectItem value="lumpectomy">Lumpectomy</SelectItem>
                  <SelectItem value="reconstruction_only">Reconstruction Only</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="not_sure">Not sure</SelectItem>
                  <SelectItem value="does_not_apply">Does not apply</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Radiotherapy Details */}
          {(item.treatments || []).includes('radio') && (
            <div className="space-y-4 border p-4 rounded-md mt-4 animate-fade-in bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-semibold text-sm">{t('radiotherapyDetails')}</h4>
              <div className="space-y-2">
                <Label>{t('radiotherapyAreas')}</Label>
                <CheckboxGroup
                  options={[
                    { id: "head_neck", label: "Head/neck/brain" },
                    { id: "chest", label: "Chest/breast/mediastinum" },
                    { id: "abdomen", label: "Abdomen/pelvis" },
                    { id: "spine", label: "Spine/limbs" },
                    { id: "whole", label: "Whole body" },
                    { id: "other", label: "Other" }
                  ]}
                  value={item.rt_region || []}
                  onChange={(val) => handleFieldChange(index, 'rt_region', val)}
                  idPrefix={`rt_region_${index}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('ageFirstRt')}</Label>
                  <input type="number" className="flex h-10 w-full border border-input px-3" value={item.rt_age_first || ""} onChange={e => handleFieldChange(index, 'rt_age_first', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('yearLastRt')}</Label>
                  <YearInput value={item.rt_year_last} onChange={val => handleFieldChange(index, 'rt_year_last', val)} />
                </div>
              </div>
            </div>
          )}

          {/* Systemic/Drug Details */}
          {((item.treatments || []).includes('chemo') || (item.treatments || []).includes('immuno')) && (
            <div className="space-y-4 border p-4 rounded-md mt-4 animate-fade-in bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-semibold text-sm">{t('drugTreatmentDetails')}</h4>
              <div className="space-y-2">
                <Label>{t('drugTreatmentType')}</Label>
                <CheckboxGroup
                  options={[
                    { id: "chemo_classic", label: "Classic Chemo" },
                    { id: "targeted", label: "Targeted Therapy" },
                    { id: "immuno", label: "Immunotherapy" },
                    { id: "other", label: "Other" }
                  ]}
                  value={item.sys_type || []}
                  onChange={(val) => handleFieldChange(index, 'sys_type', val)}
                  idPrefix={`sys_type_${index}`}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('stillTaking')}</Label>
                <Select value={item.sys_current} onValueChange={(val) => handleFieldChange(index, 'sys_current', val)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {item.sys_current === 'No' && (
                <div className="space-y-2">
                  <Label>{t('yearFinished')}</Label>
                  <YearInput value={item.sys_year_last} onChange={val => handleFieldChange(index, 'sys_year_last', val)} />
                </div>
              )}
            </div>
          )}

          {/* Endocrine Details */}
          {(item.treatments || []).includes('endo') && (
            <div className="space-y-4 border p-4 rounded-md mt-4 animate-fade-in bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-semibold text-sm">{t('hormoneTherapyDetails')}</h4>
              <div className="space-y-2">
                <Label>{t('indication')}</Label>
                <Select value={item.endo_indication} onValueChange={(val) => handleFieldChange(index, 'endo_indication', val)}>
                  <SelectTrigger><SelectValue placeholder="Select indication" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breast">Breast Cancer</SelectItem>
                    <SelectItem value="prostate">Prostate Cancer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('currentlyTaking')}</Label>
                <Select value={item.endo_current} onValueChange={(val) => handleFieldChange(index, 'endo_current', val)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('totalDurationYears')}</Label>
                <input type="number" step="0.5" className="flex h-10 w-full border border-input px-3" value={item.endo_years_total || ""} onChange={e => handleFieldChange(index, 'endo_years_total', Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>
      )}
    </RepeatingGroup>
  );
};