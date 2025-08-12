
import { calculateLinearRegression } from "./statistics";

describe("calculateLinearRegression", () => {
  it("should calculate slope and y-intercept for a positive trend", () => {
    const points = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
    ];
    const result = calculateLinearRegression(points);
    expect(result?.slope).toBeCloseTo(10);
    expect(result?.yIntercept).toBeCloseTo(10);
    expect(result?.predict(3)).toBeCloseTo(40);
  });

  it("should return null if there are fewer than two points", () => {
    const singlePoint = [{ x: 1, y: 1 }];
    const noPoints: any[] = [];
    expect(calculateLinearRegression(singlePoint)).toBeNull();
    expect(calculateLinearRegression(noPoints)).toBeNull();
  });

  it("should return null for vertical data points to avoid division by zero", () => {
    const points = [
      { x: 2, y: 10 },
      { x: 2, y: 20 },
      { x: 2, y: 30 },
    ];
    const result = calculateLinearRegression(points);
    expect(result).toBeNull();
  });

  it("should handle a flat trend correctly", () => {
    const points = [
      { x: 0, y: 50 },
      { x: 1, y: 50 },
      { x: 2, y: 50 },
    ];
    const result = calculateLinearRegression(points);
    expect(result?.slope).toBeCloseTo(0);
    expect(result?.yIntercept).toBeCloseTo(50);
    expect(result?.predict(10)).toBeCloseTo(50);
  });

  it("should handle a negative trend correctly", () => {
    const points = [
      { x: 0, y: 40 },
      { x: 1, y: 30 },
      { x: 2, y: 20 },
    ];
    const result = calculateLinearRegression(points);
    expect(result?.slope).toBeCloseTo(-10);
    expect(result?.yIntercept).toBeCloseTo(40);
    expect(result?.predict(3)).toBeCloseTo(10);
  });
});