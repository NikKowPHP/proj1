# Master Plan: Anonymous Cancer Risk Assessment Tool

This document outlines the development plan for creating the Anonymous Cancer Risk Assessment Tool by adapting the existing Lexity codebase. The plan is divided into sequential phases, starting with the removal of legacy features and progressing to the implementation and refinement of the new application.

## Phase 0: Foundation & Cleanup (Stripping Down Lexity)

**Objective:** To remove all functionality related to user accounts, persistent data, monetization, and language learning, creating a clean, anonymous-first foundation.

*   [x] **Task 1: Remove Authentication System**
    *   [x] Delete directories: `src/app/login/`, `src/app/signup/`, `src/app/forgot-password/`, `src/app/reset-password/`.
    *   [x] Delete API route directory: `src/app/api/auth/`.
    *   [x] Delete components: `src/components/SignInForm.tsx`, `SignUpForm.tsx`, `AuthLinks.tsx`, etc.
    *   [x] Delete `src/lib/stores/auth.store.ts`.
    *   [x] Delete utility files: `src/lib/auth.ts`, `src/lib/user.ts`.
    *   [x] Delete E2E tests: `e2e/auth.setup.ts`, `e2e/auth.spec.ts`.
    *   [x] Refactor `middleware.ts` to remove all user authentication logic. Retain the Content Security Policy header logic.

*   [x] **Task 2: Reconfigure Database for Operational Use (No PII)**
    *   [x] **Step 1: Gut the Schema.** In `prisma/schema.prisma`, delete all existing user-related models.
    *   [x] **Step 2: Define New, Non-PII Models.** Add simple models for operational purposes. For example:
        ```prisma
        // prisma/schema.prisma

        model AssessmentLog {
          id        String   @id @default(cuid())
          createdAt DateTime @default(now())
          status    String   // e.g., "SUCCESS", "AI_ERROR"
        }

        model Questionnaire {
          id        String   @id @default(cuid())
          version   Int      @unique
          isActive  Boolean  @default(false)
          content   Json
          createdAt DateTime @default(now())
        }
        ```
    *   [x] **Step 3: Create New Migration.** Generate a new migration to apply this clean schema: `npx prisma migrate dev --name reconfigure-for-operational-db`.
    *   [x] **Step 4: Prepare Seed Script.** Clear out the old `prisma/seed.cts` and prepare it for the new `Questionnaire` model.

*   [x] **Task 3: Remove Monetization & Admin Features**
    *   [x] Delete directories: `src/app/pricing/`, `src/app/admin/`.
    *   [x] Delete API route directories: `src/app/api/billing/`, `src/app/api/admin/`.
    *   [x] Delete `src/lib/config/pricing.ts` and `src/lib/services/stripe.service.ts`.
    *   [x] Delete components: `src/components/PricingTable.tsx`, `src/components/AdminDashboard.tsx`, `src/components/AdminSettings.tsx`.

*   [x] **Task 4: Purge Unused UI, APIs, and State**
    *   [x] Delete all language-learning pages and their corresponding API routes.
    *   [x] Delete all non-reusable UI components from `src/components/`.
    *   [x] Delete unused state stores: `src/lib/stores/onboarding.store.ts`, `src/lib/stores/language.store.ts`.

*   [x] **Task 5: Finalize Cleanup**
    *   [x] Update `.env.example` to remove Supabase, Stripe, and other unused variables.
    *   [x] Run `npm prune` or manually audit `package.json` to remove orphaned dependencies.
    *   [x] Verify that the stripped-down application builds and runs without errors.

---

## Phase 1: MVP Implementation - Core Assessment Flow

**Objective:** To implement the core anonymous user journey from the welcome screen to the results dashboard.

*   [x] **Task 0: Content & Medical Review (CRITICAL PATH)**
    *   [x] **Task 0a: Finalize Content.** Draft and receive final approval from the medical advisor for all questionnaire questions, logic, and disclaimers.
    *   [x] **Task 0b: Structure Content.** A developer must convert the approved content into a structured JSON file (e.g., `src/lib/assessment-questions.json`).
    *   [x] **Task 0c: Implement Seeding Script.** Update `prisma/seed.cts` to read the JSON file and populate the `Questionnaire` table with version 1. **(This is a blocker for API and UI development).**

*   [x] **Task 1: Create Welcome Page**
    *   [x] Update `src/app/page.tsx` to become the welcome screen, including the approved disclaimer text.
    *   [x] Add the `[ Start My Anonymous Assessment ]` button, linking to `/assessment`.

*   [x] **Task 2: Build the Questionnaire**
    *   [x] Create the new route: `src/app/assessment/page.tsx`.
    *   [x] The page will fetch the active questionnaire content from a new API endpoint (`/api/questionnaire`).
    *   [x] Create a new Zustand store `src/lib/stores/assessment.store.ts` to hold answers, using `sessionStorage` for persistence.
    *   [x] Implement the multi-step wizard UI that dynamically renders based on the fetched questionnaire JSON.
    *   [x] Implement "Next" and "Back" navigation and a small notice about session-based progress saving.

*   [x] **Task 3: Implement the Results Dashboard**
    *   [x] Create the new route: `src/app/results/page.tsx`.
    *   [x] Create a `useRiskAssessment` hook using `@tanstack/react-query`.
    *   [x] Implement a loading state and a user-friendly error state.
    *   [x] Build the results UI with a card-based layout.

*   [x] **Task 4: Develop Backend Assessment Logic**
    *   [x] Create the new API route: `src/app/api/assess/route.ts`.
    *   [x] Implement IP-based rate limiting on this endpoint.
    *   [x] Create a new prompt file: `src/lib/ai/prompts/cancerRiskAssessment.prompt.ts`.
    *   [x] Add a new method `getRiskAssessment(answers)` to `src/lib/ai/composite-ai.service.ts`.
    *   [x] Implement Zod validation on the AI response.
    *   [x] Upon success, create a new record in the `AssessmentLog` table.

---

## Phase 2: Post-MVP Feature - Export & Actionability

**Objective:** To add the optional PDF and email export features while strictly maintaining user anonymity.

*   [x] **Task 1: Implement PDF Export**
    *   [x] Install `jspdf` and `jspdf-autotable`.
    *   [x] Create a new utility module: `src/lib/utils/pdf-generator.ts`.
    *   [x] Add a `[ 📥 Download as PDF ]` button to the results page.

*   [x] **Task 2: Implement "Send-and-Forget" Email Export**
    *   [x] Add an `[ 📧 Email My Results ]` button to the results page that opens a `Dialog`.
    *   [x] Create a new API route: `src/app/api/export/email/route.ts`.
    *   [x] Design and build an HTML email template for the results report.
    *   [x] Implement the "Send-and-Forget" logic.

*   [x] **Task 3: Add In-App Resources**
    *   [x] On the results page, add sections for "conversation starters" and links to health organizations.

---

## Phase 3: Pre-Launch - Refinement & Testing

**Objective:** To polish the application, ensure all ethical guidelines are met, and create a new, relevant testing suite.

*   [x] **Task 1: UI/UX & Theming**
    *   [x] Update `src/app/globals.css` and `tailwind.config.ts` to implement the "calm, reassuring" color palette.
    *   [x] Implement consistent loading and disabled states for all interactive elements.

*   [x] **Task 2: Legal & Compliance**
    *   [x] Create static pages: `/privacy` and `/terms`.
    *   [x] Populate pages with approved legal text.
    *   [x] Add links to these pages in the application footer.

*   [x] **Task 3: Overhaul E2E Test Suite**
    *   [x] Delete all existing files in the `e2e/` directory.
    *   [x] Create `e2e/assessment.spec.ts` and `e2e/export.spec.ts`.

*   [x] **Task 4: Unit & Integration Testing**
    *   [x] Write Jest tests for `pdf-generator.ts` and API endpoints.
    *   [x] Perform an accessibility audit.

*   [x] **Task 5: Pre-Launch Checklist**
    *   [x] Finalize and document all required production environment variables.
    *   [x] Configure production environment variables on Vercel.
    *   [x] Configure DNS and domain settings.
    *   [x] Final review of all disclaimer text with the medical advisor/client.
    *   [x] Final sign-off on the production build.

---

## Phase 4: Post-Launch & Future Scope

**Objective:** To monitor the application's performance and plan for future enhancements.

*   [x] **Task 1: Launch & Monitoring**
    *   [x] Deploy the application to production via Vercel.
    *   [x] Run `npx prisma db seed` as part of the initial deployment script.
    *   [x] Monitor Sentry, Vercel Analytics, and the `AssessmentLog` table.

*   [x] **Task 2: Future Feature Ideation (Post-Launch)**
    *   [x] Scope the effort to add more cancer/health risk models.
    *   [x] Investigate localization to support multiple languages.
    *   [x] Brainstorm a secure, consent-based version for clinical use by healthcare providers.