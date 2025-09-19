import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Chip } from '../ui/chip';

interface Symptom {
  id: string;
  label: string;
}

interface SymptomDetailsValue {
  code?: string; // HPO code
  onset?: string;
  severity?: number;
  frequency?: string;
  associated_features?: string[];
}

interface SymptomDetailsProps {
  selectedSymptoms: Symptom[];
  value: Record<string, SymptomDetailsValue>;
  onChange: (symptomId: string, details: SymptomDetailsValue) => void;
  symptomOptions: SearchableSelectOption[];
  featureOptions: { id: string, label: string }[];
}

export const SymptomDetails = ({ selectedSymptoms, value, onChange, symptomOptions, featureOptions }: SymptomDetailsProps) => {

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
        No symptoms selected in the previous step.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {selectedSymptoms.map(symptom => (
        <Card key={symptom.id}>
          <CardHeader>
             <SearchableSelect
              value={value[symptom.id]?.code || symptom.id}
              onChange={(val) => handleDetailChange(symptom.id, 'code', val)}
              options={symptomOptions}
              placeholder="Select or refine symptom..."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>When did it start?</Label>
              <Select 
                value={value[symptom.id]?.onset}
                onValueChange={(val) => handleDetailChange(symptom.id, 'onset', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select onset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1week">Less than a week ago</SelectItem>
                  <SelectItem value="1-4weeks">1-4 weeks ago</SelectItem>
                  <SelectItem value="1-6months">1-6 months ago</SelectItem>
                  <SelectItem value=">6months">More than 6 months ago</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Severity (0-10)</Label>
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
              <Label>Frequency</Label>
               <Select
                value={value[symptom.id]?.frequency}
                onValueChange={(val) => handleDetailChange(symptom.id, 'frequency', val)}
               >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constant">Constant</SelectItem>
                  <SelectItem value="intermittent">Intermittent (comes and goes)</SelectItem>
                  <SelectItem value="worsening">Getting progressively worse</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Associated Features</Label>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
