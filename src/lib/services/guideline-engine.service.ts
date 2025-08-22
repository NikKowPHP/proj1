import type { GuidelinePlan } from "@/lib/types";
import configEn from "@/lib/preventive-plan-config.en.json";
import configPl from "@/lib/preventive-plan-config.pl.json";

type Answers = Record<string, string>;

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
  en: configEn,
  pl: configPl,
};

function checkCondition(condition: Condition, answers: Answers): boolean {
  const answer = answers[condition.questionId];
  if (answer === undefined) {
    return false;
  }

  switch (condition.operator) {
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(answer);
    case "equals":
      return answer === condition.value;
    default:
      return false;
  }
}

/**
 * Generates a preventive care plan based on user answers and a set of rules.
 * @param answers A record of question IDs and the user's corresponding answers.
 * @param locale The locale to use for the guideline configuration.
 * @returns A `GuidelinePlan` object containing action IDs categorized for the AI.
 */
export function generatePlan(
  answers: Answers,
  locale: string = "en",
): GuidelinePlan {
  const config = configs[locale] || configs.en;
  const plan: Omit<GuidelinePlan, "userAnswers"> = {
    screenings: [],
    lifestyle: [],
    topicsForDoctor: [],
  };

  for (const rule of config.rules) {
    // All conditions for a rule must be met (AND logic)
    const conditionsMet = rule.conditions.every((cond) =>
      checkCondition(cond, answers),
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
      