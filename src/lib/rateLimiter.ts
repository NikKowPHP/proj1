interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

export const ipRateLimiter = (ip: string) => {
  const options = {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
  };

  const identifier = `ip:${ip}`;

  const now = Date.now();

  // Get or initialize the rate limit entry
  const entry = memoryStore[identifier] || {
    count: 0,
    resetTime: now + options.windowMs,
  };

  // Reset count if window has passed
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + options.windowMs;
  }

  // Check if limit exceeded
  if (entry.count >= options.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count and save
  entry.count++;
  memoryStore[identifier] = entry;

  return { allowed: true, remaining: options.max - entry.count };
};