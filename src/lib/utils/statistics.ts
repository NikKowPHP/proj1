interface Point {
  x: number;
  y: number;
}

interface LinearRegressionResult {
  slope: number;
  yIntercept: number;
  predict: (x: number) => number;
}

/**
 * Calculates the linear regression of a set of data points.
 * This function determines the line of best fit (y = mx + b)
 * for the provided points.
 *
 * @param points An array of objects, each with 'x' and 'y' numerical properties.
 * @returns An object containing the slope (m), y-intercept (b), and a predict function,
 *          or null if the input is insufficient to perform the calculation.
 */
export function calculateLinearRegression(
  points: Point[],
): LinearRegressionResult | null {
  const n = points.length;

  // Linear regression requires at least two points to define a line.
  if (n < 2) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const denominator = n * sumXX - sumX * sumX;

  // Avoid division by zero if all x-values are the same.
  if (denominator === 0) {
    return null;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const yIntercept = (sumY - slope * sumX) / n;

  const predict = (x: number): number => {
    return slope * x + yIntercept;
  };

  return { slope, yIntercept, predict };
}