
import { useState, useCallback, useEffect } from "react";

export const useFeatureFlag = (featureName: string): [boolean, () => void] => {
  const key = `feature_seen_${featureName}`;

  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(key);
      if (!seen) {
        setIsNew(true);
      }
    }
  }, [key]);

  const markAsSeen = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, "true");
      setIsNew(false);
    }
  }, [key]);

  return [isNew, markAsSeen];
};