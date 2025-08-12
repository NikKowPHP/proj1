import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Read from test specific .env file.
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// Add a check to ensure Supabase credentials are not placeholders
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-test-project") ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-test-project")
) {
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
  );
  console.error(
    "!!! E2E TEST CONFIGURATION ERROR                                     !!!",
  );
  console.error(
    "!!!------------------------------------------------------------------!!!",
  );
  console.error(
    "!!! Your '.env.test' file contains placeholder values for Supabase.  !!!",
  );
  console.error(
    "!!! Please replace them with credentials from a real, dedicated    !!!",
  );
  console.error(
    "!!! test project. See the instructions in '.env.test' for details. !!!",
  );
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
  );
  process.exit(1); // Exit with an error code to stop the test run
}

// Use a distinct port for E2E tests to avoid conflicts with local development
const PORT = process.env.PORT || 3001;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY!,
      AI_PROVIDER: process.env.AI_PROVIDER!,
      GEMINI_API_KEY_1: process.env.GEMINI_API_KEY_1!,
    },
  },

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [
    // Setup project
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // Main test projects
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["setup"],
      testIgnore: ["e2e/onboarding.spec.ts"],
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
      dependencies: ["setup"],
      testIgnore: ["e2e/onboarding.spec.ts"],
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
      dependencies: ["setup"],
      testIgnore: ["e2e/onboarding.spec.ts"],
    },

    // Onboarding test project (runs without saved auth state)
    {
      name: "onboarding-chromium",
      testMatch: "e2e/onboarding.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      // No dependencies, as it creates its own user
    },
  ],
});