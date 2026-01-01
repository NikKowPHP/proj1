'use client'

import React, { useState } from "react";
import { RepeatingGroup } from "../ui/RepeatingGroup";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SearchableSelect, SearchableSelectOption } from "../ui/SearchableSelect";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useTranslations } from 'next-intl';
import { Card, CardContent } from "../ui/card";
import { Info } from "lucide-react";

interface CancerDiagnosis {
  cancer_type?: string;
  age_dx?: number;
  laterality?: string;
  bilateral_or_multiple?: string;
  known_genetic_syndrome?: boolean;
}

interface FamilyMember {
  relation?: string;
  side_of_family?: string; // Maternal, Paternal, Both parents, N/A, Not sure
  vital_status?: string; // Alive, Deceased
  age_now_death?: number; // Age now or at death
  cancers?: CancerDiagnosis[]; // Array of cancers instead of single cancer
  sex_at_birth?: string;
  is_blood_related?: boolean;
}

interface FamilyCancerHistoryProps {
  value: FamilyMember[];
  onChange: (value: FamilyMember[]) => void;
  options: {
    relations: string[];
    cancerTypes: SearchableSelectOption[];
  };
  errors?: Record<string, string | undefined>;
}

export const FamilyCancerHistory = ({ value, onChange, options, errors: externalErrors }: FamilyCancerHistoryProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<number, { age_now_death?: string, side_of_family?: string }>>({});

  const handleAdd = (relation?: string) => {
    let side = undefined;
    if (relation === 'Mother' || relation === 'Maternal Grandmother' || relation === 'Maternal Grandfather') side = 'Maternal';
    if (relation === 'Father' || relation === 'Paternal Grandmother' || relation === 'Paternal Grandfather') side = 'Paternal';
    if (relation === 'Sister' || relation === 'Brother') side = 'N/A'; // Siblings
    if (relation === 'Daughter' || relation === 'Son') side = 'Both parents'; // Children

    onChange([...value, { cancers: [], relation: relation || '', side_of_family: side }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof FamilyMember, fieldValue: any) => {
    if (field === "age_now_death") {
      const num = Number(fieldValue);
      if (fieldValue && (isNaN(num) || num < 0 || num > 120)) {
        setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: 'Invalid age.' } }));
      } else {
        const newErrors = { ...errors[index] };
        delete newErrors[field];
        setErrors(prev => ({ ...prev, [index]: newErrors }));
      }
    }

    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };

    // Auto-infer side if relation changes
    if (field === 'relation') {
      let side = newValues[index].side_of_family;
      const rel = fieldValue as string;
      if (rel.includes('Maternal') || rel === 'Mother') side = 'Maternal';
      else if (rel.includes('Paternal') || rel === 'Father') side = 'Paternal';
      else if (['Sister', 'Brother'].includes(rel)) side = 'N/A';
      else if (['Daughter', 'Son'].includes(rel)) side = 'Both parents';
      else side = undefined; // Force user to pick for cousins etc.
      newValues[index].side_of_family = side;
    }

    onChange(newValues);
  };

  const handleAddCancer = (memberIndex: number) => {
    const newValues = [...value];
    const currentCancers = newValues[memberIndex].cancers || [];
    newValues[memberIndex] = {
      ...newValues[memberIndex],
      cancers: [...currentCancers, {}]
    };
    onChange(newValues);
  };

  const handleRemoveCancer = (memberIndex: number, cancerIndex: number) => {
    const newValues = [...value];
    const currentCancers = newValues[memberIndex].cancers || [];
    newValues[memberIndex] = {
      ...newValues[memberIndex],
      cancers: currentCancers.filter((_, i) => i !== cancerIndex)
    };
    onChange(newValues);
  };

  const handleCancerFieldChange = (memberIndex: number, cancerIndex: number, field: keyof CancerDiagnosis, cancerFieldValue: any) => {
    const newValues = [...value]; // Corrected from this.value
    const cancers = newValues[memberIndex].cancers || [];
    cancers[cancerIndex] = { ...cancers[cancerIndex], [field]: cancerFieldValue };
    newValues[memberIndex] = { ...newValues[memberIndex], cancers };
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-4">
        <CardContent className="p-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('biologicalFamilyHelper')}
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2 mb-4">
        {["Mother", "Father", "Sister", "Brother", "Daughter", "Son"].map(rel => (
          <button
            key={rel}
            type="button"
            onClick={() => handleAdd(rel)}
            className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary  text-sm font-medium transition-colors"
          >
            {t(`add${rel}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleAdd()}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700  text-sm font-medium transition-colors"
        >
          {t('addOther')}
        </button>
      </div>
      <RepeatingGroup
        values={value}
        onAdd={() => handleAdd()}
        onRemove={handleRemove}
        addLabel={t('addCustomRelative')}
      >
        {(item, index) => (
          <div className="space-y-4 border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('relation')}</Label>
                <Select
                  value={item.relation}
                  onValueChange={(val) => handleFieldChange(index, "relation", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.relations.map((relation) => (
                      <SelectItem key={relation} value={relation}>
                        {relation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('sideOfFamily')} {['Aunt', 'Uncle', 'Grandmother', 'Grandfather', 'Cousin'].some(r => item.relation?.includes(r)) && <span className="text-red-500">*</span>}</Label>
                <Select
                  value={item.side_of_family}
                  onValueChange={(val) => handleFieldChange(index, "side_of_family", val)}
                >
                  <SelectTrigger className={errors[index]?.side_of_family ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maternal">Maternal</SelectItem>
                    <SelectItem value="Paternal">Paternal</SelectItem>
                    <SelectItem value="Both parents">Both parents</SelectItem>
                    <SelectItem value="N/A">N/A (e.g. Sibling)</SelectItem>
                    <SelectItem value="Not sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('sexAtBirth')}</Label>
                <Select
                  value={item.sex_at_birth}
                  onValueChange={(val) => handleFieldChange(index, "sex_at_birth", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Intersex">Intersex</SelectItem>
                    <SelectItem value="Difference in sex development">Difference in sex development</SelectItem>
                    <SelectItem value="Not sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`blood_related_${index}`}
                    checked={item.is_blood_related}
                    onCheckedChange={(c) => handleFieldChange(index, "is_blood_related", !!c)}
                  />
                  <Label htmlFor={`blood_related_${index}`} className="font-normal">{t('bloodRelated')}</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vitalStatus')}</Label>
                <Select
                  value={item.vital_status}
                  onValueChange={(val) => handleFieldChange(index, "vital_status", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alive">Alive</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                    <SelectItem value="Not sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{item.vital_status === 'Deceased' ? t('ageAtDeath') : t('currentAge')}</Label>
                <Input
                  type="number"
                  value={item.age_now_death ?? ""}
                  onChange={(e) => handleFieldChange(index, "age_now_death", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 65"
                />
                {errors[index]?.age_now_death && <p className="text-sm text-destructive">{errors[index].age_now_death}</p>}
              </div>
            </div>

            {/* Cancer History - Nested Repeating Group */}
            <div className="space-y-2">
              <Label className="font-semibold">{t('cancerHistory')}</Label>
              <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                {(item.cancers || []).map((cancer, cancerIndex) => (
                  <div key={cancerIndex} className="space-y-2 bg-gray-50 p-3 rounded relative animate-fade-in">
                    <button
                      type="button"
                      onClick={() => handleRemoveCancer(index, cancerIndex)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                      {t('remove')}
                    </button>
                    <div className="space-y-2">
                      <Label>{t('typeOfCancer')}</Label>
                      <SearchableSelect
                        value={cancer.cancer_type}
                        onChange={(val) => handleCancerFieldChange(index, cancerIndex, "cancer_type", val)}
                        options={options.cancerTypes}
                        placeholder="Search cancer type..."
                      />
                    </div>
                    {cancer.cancer_type === 'other' && (
                      <div className="space-y-2 animate-fade-in">
                        <Label>{t('specifyOther') || "Specify Other Cancer"}</Label>
                        <Input
                          type="text"
                          value={(cancer as any).cancer_type_other || ""}
                          onChange={(e) => handleCancerFieldChange(index, cancerIndex, "cancer_type_other" as any, e.target.value)}
                          placeholder="e.g. Bone Cancer"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>{t('ageAtDiagnosis')}</Label>
                      <Input
                        type="number"
                        value={cancer.age_dx ?? ""}
                        onChange={(e) => handleCancerFieldChange(index, cancerIndex, "age_dx", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 55"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('laterality')}</Label>
                      <Select
                        value={cancer.laterality}
                        onValueChange={(val) => handleCancerFieldChange(index, cancerIndex, "laterality", val)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Left">Left</SelectItem>
                          <SelectItem value="Right">Right</SelectItem>
                          <SelectItem value="Bilateral">Bilateral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {cancer.cancer_type && [
                      'breast', 'kidney', 'colorectal', 'sarcoma', 'melanoma',
                      'uterine', 'endometrial', 'ovarian', 'thyroid', 'brain', 'cns'
                    ].some(site => cancer.cancer_type?.toLowerCase().includes(site)) && (
                        <div className="space-y-2 pt-2">
                          <Label className="font-normal text-sm">{t('bilateralOrMultiple')}</Label>
                          <Select
                            value={cancer.bilateral_or_multiple}
                            onValueChange={(val) => handleCancerFieldChange(index, cancerIndex, "bilateral_or_multiple", val)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Not sure">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id={`genetic_syndrome_${index}_${cancerIndex}`}
                        checked={cancer.known_genetic_syndrome}
                        onCheckedChange={(c) => handleCancerFieldChange(index, cancerIndex, "known_genetic_syndrome", !!c)}
                      />
                      <Label htmlFor={`genetic_syndrome_${index}_${cancerIndex}`} className="font-normal text-sm">
                        {t('linkedToGenetic')}
                      </Label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddCancer(index)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + {t('addCancer')}
                </button>
              </div>
            </div>
          </div>
        )}
      </RepeatingGroup>
    </div>
  );
};
