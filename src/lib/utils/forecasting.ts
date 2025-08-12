
// src/lib/utils/forecasting.ts
/**
 * This module implements a hybrid forecasting model for predicting user proficiency over time.
 * The core idea is to use the right tool for the job based on the amount of available data.
 *
 * Model Selection Rationale:
 * 1. Holt's Linear Trend (for < 20 data points): A simple, robust model that's effective for
 *    establishing an initial trend without being overly influenced by early volatility. It's
 *    less likely to overfit on sparse data.
 * 2. Holt's Damped Trend (for >= 20 data points): A more sophisticated model that's ideal for
 *    long-term forecasting of learning curves. It recognizes that growth is not infinite and
 *    naturally slows down as a user approaches mastery. The "damping" factor moderates the
 *    trend over time, preventing unrealistic long-term predictions.
 *
 * Parameter Optimization:
 * For both models, we don't use static smoothing parameters (alpha, beta, phi). Instead, we
 * perform a grid search to find the optimal parameters that best fit the user's historical
 * data, minimizing the Mean Squared Error (MSE). This makes the forecast adaptive to each
 * user's unique learning pace.
 */


// --- Constants ---
const MIN_ENTRIES_FOR_COMPLEX_MODEL = 20;

// --- Internal Helper Functions ---

/**
 * Calculates the Mean Squared Error (MSE) for a set of forecasts.
 */
function calculateMSE(actuals: number[], forecasts: number[]): number {
  if (actuals.length !== forecasts.length || actuals.length === 0) {
    return Infinity;
  }
  const error = actuals.reduce((sum, actual, i) => {
    return sum + (actual - forecasts[i]) ** 2;
  }, 0);
  return error / actuals.length;
}

/**
 * Finds optimal parameters for Holt's methods by minimizing MSE.
 * Can be used for both linear and damped trend models.
 */
function findOptimalParameters(data: number[], modelType: 'linear' | 'damped'): { alpha: number; beta: number, phi: number } {
  let bestAlpha = 0.5, bestBeta = 0.5, bestPhi = 0.9, minMse = Infinity;
  const phiIterations = modelType === 'damped' ? 20 : 1; // Iterate over phi only for damped model

  for (let i = 1; i <= 9; i++) { // Alpha
    const alpha = i / 10;
    for (let j = 1; j <= 9; j++) { // Beta
      const beta = j / 10;
      for (let p = 0; p < phiIterations; p++) { // Phi (damping factor)
        const phi = modelType === 'damped' ? (80 + p) / 100 : 1.0; // phi is 1 for linear trend
        
        let level = data[0], trend = data[1] - data[0];
        const forecasts: number[] = [];

        for (let k = 1; k < data.length; k++) {
            forecasts.push(level + phi * trend);
            const value = data[k];
            const lastLevel = level;
            level = alpha * value + (1 - alpha) * (lastLevel + phi * trend);
            trend = beta * (level - lastLevel) + (1 - beta) * phi * trend;
        }
        
        const mse = calculateMSE(data.slice(1), forecasts);
        if (mse < minMse) {
            minMse = mse;
            bestAlpha = alpha;
            bestBeta = beta;
            bestPhi = phi;
        }
      }
    }
  }
  return { alpha: bestAlpha, beta: bestBeta, phi: bestPhi };
}


// --- Forecasting Models ---

/**
 * Holt's Linear Trend Method with adaptive parameter optimization.
 */
function holtLinearTrendOptimized(data: number[], horizon: number): number[] {
  const { alpha, beta } = findOptimalParameters(data, 'linear');
  let level = data[0], trend = data[1] - data[0];
  
  for (let i = 1; i < data.length; i++) {
    const value = data[i];
    const lastLevel = level;
    level = alpha * value + (1 - alpha) * (lastLevel + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  const forecast: number[] = [];
  for (let i = 1; i <= horizon; i++) {
    let nextForecast = level + i * trend;
    const difficultyFactor = ((100 - Math.max(0, nextForecast)) / 100) ** 1.5;
    nextForecast = level + i * (trend * difficultyFactor);
    forecast.push(Math.min(100, Math.max(0, nextForecast)));
  }
  return forecast;
}

/**
 * Holt's Damped Trend Method with adaptive parameter optimization.
 */
function holtDampedTrendOptimized(data: number[], horizon: number): number[] {
    const { alpha, beta, phi } = findOptimalParameters(data, 'damped');
    let level = data[0], trend = data[1] - data[0];

    for (let i = 1; i < data.length; i++) {
        const value = data[i];
        const lastLevel = level;
        level = alpha * value + (1 - alpha) * (lastLevel + phi * trend);
        trend = beta * (level - lastLevel) + (1 - beta) * phi * trend;
    }

    const forecast: number[] = [];
    for (let i = 1; i <= horizon; i++) {
        const dampedTrendSum = Array.from({ length: i }, (_, k) => phi ** (k + 1)).reduce((a, b) => a + b, 0);
        const nextForecast = level + dampedTrendSum * trend;
        forecast.push(Math.min(100, Math.max(0, nextForecast)));
    }
    return forecast;
}


// --- Main Exported Function ---

/**
 * Generates a forecast using a hybrid model approach.
 * It selects a simple linear trend model for smaller datasets and
 * a more robust damped trend model for larger datasets to improve long-term accuracy.
 *
 * @param data An array of numbers representing the time series data.
 * @param horizon The number of future periods to forecast.
 * @returns An array of forecasted values for the specified horizon.
 */
export function forecast(data: number[], horizon: number): number[] {
  if (data.length < 2) {
    const lastValue = data.length === 1 ? data[0] : 0;
    return Array(horizon).fill(lastValue);
  }

  if (data.length < MIN_ENTRIES_FOR_COMPLEX_MODEL) {
    // Use the simpler, more stable linear trend model for sparse data
    return holtLinearTrendOptimized(data, horizon);
  } else {
    // Use the more sophisticated damped model for richer data
    return holtDampedTrendOptimized(data, horizon);
  }
}