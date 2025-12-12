import type { GuidelinePlan } from "@/lib/types";
import configEn from "@/lib/preventive-plan-config.en.json";
import configPl from "@/lib/preventive-plan-config.pl.json";

// Type assertion for imported JSON configs
const configEnTyped = configEn as PlanConfig;
const configPlTyped = configPl as PlanConfig;

type Answers = Record<string, any>;

interface Condition {
  questionId: string;
  operator: "in" | "equals" | "array_contains" | "array_contains_any";
  value: string | string[] | boolean;
}

interface Rule {
  actionId: string;
  category: "screenings" | "lifestyle" | "topicsForDoctor";
  conditions: Condition[];
}

interface PlanConfig {
  rules: Rule[];
}

const configs: { [key: string]: PlanConfig } = {
  en: configEnTyped,
  pl: configPlTyped,
};

/**
 * Maps a numerical age to a predefined age range string.
 * @param age - The numerical age.
 * @returns The corresponding age range string or an empty string if no match.
 */
const mapAgeToRange = (age?: number): string => {
    if (age === undefined) return "";
    if (age >= 18 && age <= 29) return "18-29";
    if (age >= 30 && age <= 39) return "30-39";
    if (age >= 40 && age <= 44) return "40-44";
    if (age >= 45 && age <= 49) return "45-49";
    if (age >= 50 && age <= 54) return "50-54";
    if (age >= 55 && age <= 59) return "55-59";
    if (age >= 60 && age <= 69) return "60-69";
    if (age >= 70) return "70+";
    return "";
}

function checkCondition(condition: Condition, answers: Answers, derived: Answers): boolean {
  // Special handling for occupational exposures which are nested in an array of objects
  if (condition.questionId === 'occupational_exposures') {
      const jobHistoryAnswer = answers['occupational_hazards'];
      if (typeof jobHistoryAnswer !== 'string' || !jobHistoryAnswer.startsWith('[')) {
          return false;
      }
      try {
          const jobs: { occ_exposures?: string[] }[] = JSON.parse(jobHistoryAnswer);
          if (!Array.isArray(jobs)) return false;

          const allExposures = jobs.flatMap(job => job.occ_exposures || []);
          if (condition.operator === 'array_contains') {
              return typeof condition.value === 'string' && allExposures.includes(condition.value);
          }
      } catch (e) {
          return false;
      }
      return false;
  }

  // Prioritize derived values, then fall back to raw answers
  let value = derived[condition.questionId] ?? answers[condition.questionId];
  
  if (value === undefined || value === null) {
    return false;
  }

  switch (condition.operator) {
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(value);
    case "equals":
      return value === condition.value;
    case "array_contains":
    case "array_contains_any": {
      // The value might be a JSON string from the form, so we parse it.
      if (typeof value === 'string' && value.startsWith('[')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          return false; // Not a valid JSON array string
        }
      }
      
      if (!Array.isArray(value)) return false;

      if (condition.operator === 'array_contains') {
        return typeof condition.value === 'string' && value.includes(condition.value);
      } else { // array_contains_any
        if (!Array.isArray(condition.value)) return false;
        return condition.value.some(item => typeof item === 'string' && value.includes(item));
      }
    }
    default:
      return false;
  }
}

/**
 * Generates a preventive care plan based on user answers and a set of rules.
 * @param answers A record of question IDs and the user's corresponding answers.
 * @param derived A record of derived variables like age_years.
 * @param locale The locale to use for the guideline configuration.
 * @returns A `GuidelinePlan` object containing action IDs categorized for the AI.
 */
export function generatePlan(
  answers: Answers,
  derived: Answers,
  locale: string = "en",
): GuidelinePlan {
  const config = configs[locale] || configs.en;
  const plan: Omit<GuidelinePlan, "userAnswers"> = {
    screenings: [],
    lifestyle: [],
    topicsForDoctor: [],
  };

  // Create a combined context for rule evaluation, including the mapped age range
  const evaluationContext = {
      ...answers,
      age: mapAgeToRange(derived.age_years) // Add age range for backward compatibility with rules
  };

  for (const rule of config.rules) {
    // All conditions for a rule must be met (AND logic)
    const conditionsMet = rule.conditions.every((cond) =>
      checkCondition(cond, evaluationContext, derived),
    );

    if (conditionsMet) {
      plan[rule.category].push(rule.actionId);
    }
  }

  // Remove potential duplicates
  plan.screenings = [...new Set(plan.screenings)];
  plan.lifestyle = [...new Set(plan.lifestyle)];
  plan.topicsForDoctor = [...new Set(plan.topicsForDoctor)];

  return { ...plan, userAnswers: answers };
}
      