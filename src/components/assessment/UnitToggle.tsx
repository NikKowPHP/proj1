import React from 'react';
import { useAssessmentStore } from '@/lib/stores/assessment.store';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export const UnitToggle = () => {
  const { units, setUnits } = useAssessmentStore();
  const t = useTranslations('AssessmentPage');

  return (
    <div className="flex items-center space-x-1 border p-1 bg-muted/20">
      <Button
        variant={units === 'metric' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setUnits('metric')}
        className={`h-6 text-xs px-2 ${units === 'metric' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
      >
        Metric
      </Button>
      <Button
        variant={units === 'imperial' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setUnits('imperial')}
        className={`h-6 text-xs px-2 ${units === 'imperial' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
      >
        Imperial
      </Button>
    </div>
  );
};
