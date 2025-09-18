/// <reference types="node" />
import "@testing-library/jest-dom";

// Mock scrollIntoView for Radix UI components in JSDOM
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}

// Mock fetch for components that use it (e.g., WritingAids in JournalEditor)
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  }),
) as jest.Mock;

process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5434/onkono?schema=public";
process.env.APP_ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // A valid 32-byte key
