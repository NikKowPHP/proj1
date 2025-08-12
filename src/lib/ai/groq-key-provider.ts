let keys: string[] = [];

function initializeKeys() {
  const patternedKeys: { index: number; key: string }[] = [];
  for (const key in process.env) {
    if (/^GROQ_API_KEY_(\d+)$/.test(key)) {
      const match = key.match(/^GROQ_API_KEY_(\d+)$/);
      if (match && process.env[key]) {
        patternedKeys.push({
          index: parseInt(match[1], 10),
          key: process.env[key]!,
        });
      }
    }
  }

  if (patternedKeys.length > 0) {
    patternedKeys.sort((a, b) => a.index - b.index);
    keys = patternedKeys.map((k) => k.key);
  } else if (process.env.GROQ_API_KEY) {
    keys = [process.env.GROQ_API_KEY];
  }

  // Fail immediately if no keys are configured.
  if (keys.length === 0) {
    throw new Error(
      "No Groq API keys found. Please set GROQ_API_KEY or GROQ_API_KEY_n in your environment.",
    );
  }
}

// Initialize on module load
initializeKeys();

export function getAllKeys(): string[] {
  // Return a copy for safety, ensuring the original array isn't mutated elsewhere.
  return [...keys];
}

// For testing purposes, to re-initialize with mocked env vars
export function _resetForTesting() {
  keys = [];
  initializeKeys();
}