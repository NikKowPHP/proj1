import type { GuidelinePlan } from "@/lib/types";
import configEn from "@/lib/preventive-plan-config.en.json";
import configPl from "@/lib/preventive-plan-config.pl.json";

// Type assertion for imported JSON configs
const configEnTyped = configEn as PlanConfig;
const configPlTyped = configPl as PlanConfig;

type Answers = Record<string, any>;

interface Condition {
  questionId: string;
  operator: "in" | "equals";
  value: string | string[];
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
    if (age >= 40 && age <= 49) return "40-49";
    if (age >= 50 && age <= 59) return "50-59";
    if (age >= 60) return "60+";
    return "";
}

function checkCondition(condition: Condition, answers: Answers, derived: Answers): boolean {
  // Prioritize derived values if the questionId matches a derived key (e.g., "age")
  const value = derived[condition.questionId] ?? answers[condition.questionId];
  if (value === undefined) {
    return false;
  }

  switch (condition.operator) {
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(value);
    case "equals":
      return value === condition.value;
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
      