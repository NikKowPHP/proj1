
import { forecast } from "./forecasting";

describe("Hybrid Forecasting Model", () => {
  it("should return an array with the correct horizon length", () => {
    const data = [10, 20, 30, 40, 50];
    const result = forecast(data, 5);
    expect(result).toHaveLength(5);
  });

  // This test implies that for a short, perfectly linear dataset,
  // the linear model will be chosen and should predict the trend accurately.
  it("should forecast a strong upward trend for short datasets", () => {
    const data = [10, 12, 14, 16, 18, 20]; // 6 points < 20
    const result = forecast(data, 3);
    expect(result[0]).toBeGreaterThanOrEqual(20);
    expect(result[1]).toBeGreaterThan(result[0]);
    expect(result[2]).toBeGreaterThan(result[1]);
  });
  
  // This test implies that for a long, perfectly linear dataset,
  // the damped model will be chosen, and its prediction should be slightly
  // less aggressive than a pure linear model.
  it("should forecast a dampened upward trend for long datasets", () => {
    const linearData = Array.from({ length: 25 }, (_, i) => 10 + 2 * i); // 25 points > 20
    const linearForecast = forecast(linearData, 10);
    
    // The trend is +2. A pure linear model would predict ~68, 70, 72...
    // The damped model should predict something slightly less.
    expect(linearForecast[0]).toBeGreaterThan(58); // Last point is 58
    expect(linearForecast[9]).toBeLessThan(78); // A pure linear forecast would be 78
    expect(linearForecast[1]).toBeGreaterThan(linearForecast[0]);
  });


  it("should forecast a plateau for a flat trend regardless of length", () => {
    const shortFlatData = [50, 50, 50, 50, 50];
    const longFlatData = Array(25).fill(50);
    
    const shortForecast = forecast(shortFlatData, 3);
    const longForecast = forecast(longFlatData, 3);

    expect(shortForecast[0]).toBeCloseTo(50, 0);
    expect(longForecast[0]).toBeCloseTo(50, 0);
  });
  
  it("should return the last value for a single data point", () => {
    const data = [25];
    const result = forecast(data, 5);
    expect(result).toEqual([25, 25, 25, 25, 25]);
  });

  it("should return an array of zeros for an empty data set", () => {
    const data: number[] = [];
    const result = forecast(data, 5);
    expect(result).toEqual([0, 0, 0, 0, 0]);
  });

  it("should ensure forecast values do not exceed 100", () => {
    const data = Array.from({ length: 25 }, (_, i) => 95 + i * 0.2); // Creeps up to 99.8
    const result = forecast(data, 10);
    result.forEach((value) => {
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it("should ensure forecast values do not go below 0", () => {
    const data = Array.from({ length: 25 }, (_, i) => 5 - i * 0.2); // Creeps down to 0.2
    const result = forecast(data, 10);
    result.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });
});