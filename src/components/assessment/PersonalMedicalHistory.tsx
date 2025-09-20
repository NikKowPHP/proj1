import React from 'react';
import { Label } from '../ui/label';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { SearchableSelectOption } from '../ui/SearchableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface IllnessDetails {
  year?: number;
  status?: string;
  confirmed?: string;
  meds_note?: string;
}

interface PersonalMedicalHistoryProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  options: {
    illnesses: SearchableSelectOption[];
  };
}

export const PersonalMedicalHistory = ({ answers, onAnswer, options }: PersonalMedicalHistoryProps) => {
  const selectedIllnesses = answers['illness_list'] ? JSON.parse(answers['illness_list']) : [];

  const handleIllnessSelect = (selectedIds: string[]) => {
    onAnswer('illness_list', JSON.stringify(selectedIds));
  };
  
  const handleDetailChange = (illnessId: string, field: keyof IllnessDetails, value: any) => {
    const detailsKey = `illness_details_${illnessId}`;
    const currentDetails = answers[detailsKey] ? JSON.parse(answers[detailsKey]) : {};
    const newDetails = { ...currentDetails, [field]: value };
    onAnswer(detailsKey, JSON.stringify(newDetails));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select any conditions you have been diagnosed with:</Label>
        <CheckboxGroup
          options={options.illnesses.map(option => ({ id: option.value, label: option.label }))}
          value={selectedIllnesses}
          onChange={handleIllnessSelect}
        />
      </div>

      {selectedIllnesses.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold">Details for Selected Conditions</h3>
          {selectedIllnesses.map((illnessId: string) => {
             const detailsKey = `illness_details_${illnessId}`;
             const details: IllnessDetails = answers[detailsKey] ? JSON.parse(answers[detailsKey]) : {};
             const illnessLabel = options.illnesses.find(i => i.value === illnessId)?.label || illnessId;

            return (
              <Card key={illnessId}>
                <CardHeader>
                  <CardTitle>{illnessLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                    <Label>Year of Diagnosis</Label>
                    <YearInput
                      value={details.year}
                      onChange={(val) => handleDetailChange(illnessId, 'year', val)}
                      placeholder="e.g. 2010"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Status</Label>
                     <Select value={details.status} onValueChange={(val) => handleDetailChange(illnessId, 'status', val)}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Clinician-confirmed?</Label>
                     <Select value={details.confirmed} onValueChange={(val) => handleDetailChange(illnessId, 'confirmed', val)}>
                        <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Relevant Medications (optional)</Label>
                    <Textarea
                      value={details.meds_note}
                      onChange={(e) => handleDetailChange(illnessId, 'meds_note', e.target.value)}
                      placeholder="e.g., Aspirin, Metformin"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
};
