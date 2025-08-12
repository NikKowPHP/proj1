import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Read from test specific .env file.
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

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
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY!,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
  },

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});