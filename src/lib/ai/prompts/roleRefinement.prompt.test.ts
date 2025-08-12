import { getRoleRefinementPrompt } from "./roleRefinement.prompt";

describe("getRoleRefinementPrompt", () => {
  const role = "js dev";

  it("should return a non-empty string", () => {
    const prompt = getRoleRefinementPrompt(role);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include the role in the prompt", () => {
    const prompt = getRoleRefinementPrompt(role);
    expect(prompt).toContain(role);
  });
});
