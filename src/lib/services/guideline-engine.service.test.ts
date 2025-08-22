/** @jest-environment node */

import { generatePlan } from "./guideline-engine.service";

// Mock the config files to isolate the test from the actual JSON files
jest.mock(
  "@/lib/preventive-plan-config.en.json",
  () => ({
    rules: [
      {
        actionId: "COLORECTAL_SCREENING",
        category: "screenings",
        conditions: [{ questionId: "age", operator: "in", value: ["40-49", "50-59", "60+"] }],
      },
      {
        actionId: "DISCUSS_SMOKING",
        category: "topicsForDoctor",
        conditions: [{ questionId: "smoking_status", operator: "equals", value: "Current smoker" }],
      },
    ],
  }),
  { virtual: true },
);

jest.mock(
  "@/lib/preventive-plan-config.pl.json",
  () => ({
    rules: [
      {
        actionId: "COLORECTAL_SCREENING",
        category: "screenings",
        conditions: [{ questionId: "age", operator: "in", value: ["40-49", "50-59", "60+"] }],
      },
      {
        actionId: "DISCUSS_SMOKING",
        category: "topicsForDoctor",
        conditions: [{ questionId: "smoking_status", operator: "equals", value: "Obecny palacz" }],
      },
    ],
  }),
  { virtual: true },
);

describe("Guideline Engine Service", () => {
  it("should recommend colorectal screening for a 45-year-old", () => {
    const answers = { age: "40-49" };
    const plan = generatePlan(answers, "en");
    expect(plan.screenings).toContain("COLORECTAL_SCREENING");
    expect(plan.topicsForDoctor).toHaveLength(0);
  });

  it("should recommend discussing smoking for a current smoker (English)", () => {
    const answers = { smoking_status: "Current smoker" };
    const plan = generatePlan(answers, "en");
    expect(plan.topicsForDoctor).toContain("DISCUSS_SMOKING");
    expect(plan.screenings).toHaveLength(0);
  });

  it("should recommend discussing smoking for a current smoker (Polish)", () => {
    const answers = { smoking_status: "Obecny palacz" };
    const plan = generatePlan(answers, "pl");
    expect(plan.topicsForDoctor).toContain("DISCUSS_SMOKING");
  });

  it("should trigger multiple rules correctly", () => {
    const answers = { age: "50-59", smoking_status: "Current smoker" };
    const plan = generatePlan(answers, "en");
    expect(plan.screenings).toContain("COLORECTAL_SCREENING");
    expect(plan.topicsForDoctor).toContain("DISCUSS_SMOKING");
  });

  it("should recommend nothing if no conditions are met", () => {
    const answers = { age: "18-29", smoking_status: "Never smoked" };
    const plan = generatePlan(answers, "en");
    expect(plan.screenings).toHaveLength(0);
    expect(plan.lifestyle).toHaveLength(0);
    expect(plan.topicsForDoctor).toHaveLength(0);
  });

  it("should return the original user answers with the plan", () => {
    const answers = { age: "18-29" };
    const plan = generatePlan(answers, "en");
    expect(plan.userAnswers).toEqual(answers);
  });
});
      