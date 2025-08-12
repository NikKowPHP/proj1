
interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface RateLimitConfig {
  FREE: RateLimitOptions;
  PRO: RateLimitOptions;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

const DEFAULT_LIMITS: RateLimitConfig = {
  FREE: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 requests per day
  },
  PRO: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: Number.MAX_SAFE_INTEGER, // Unlimited
  },
};

export const authRateLimiter = (ip: string) => {
  const options = {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
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

export const srsReviewRateLimiter = (userId: string, tier: string = "FREE") => {
  const options = {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: tier === "FREE" ? 10 : Number.MAX_SAFE_INTEGER,
  };

  const identifier = `srs:${userId}`;

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

export const ttsRateLimiter = (userId: string, tier: string = "FREE") => {
  const options = {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: tier === "FREE" ? 50 : Number.MAX_SAFE_INTEGER,
  };

  const identifier = `tts:${userId}`;

  const now = Date.now();

  const entry = memoryStore[identifier] || {
    count: 0,
    resetTime: now + options.windowMs,
  };

  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + options.windowMs;
  }

  if (entry.count >= options.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  memoryStore[identifier] = entry;

  return { allowed: true, remaining: options.max - entry.count };
};

export const tieredRateLimiter = (userId: string, tier: string = "FREE") => {
  const options =
    DEFAULT_LIMITS[tier as keyof RateLimitConfig] || DEFAULT_LIMITS.FREE;
  const identifier = `user:${userId}`;

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

  // Pro users bypass rate limiting
  if (tier === "PRO" || tier === "ADMIN") {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER };
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