# Application Testing Plan

This document outlines the manual testing plan for the core functionalities of the Health Risk Assessment application.

## Phase 1: Core User Flow
- [x] Test landing page loads correctly in both English and Polish.
- [x] Test starting a new assessment.
- [x] Test completing the entire questionnaire with valid data.
- [x] Test viewing the results page after assessment.
- [x] Test the "Start New Assessment" functionality from the results page, ensuring it clears previous state.

## Phase 2: Key Features & Validation
- [x] Test the "Resume Session" functionality by refreshing the assessment page mid-way.
- [x] Test input validation for height and weight fields (e.g., non-numeric, negative, out-of-range values).
- [x] Test conditional logic in the questionnaire (e.g., smoking-related questions only appear for smokers).
- [x] Test PDF export functionality on the results page.
- [x] Test Email export functionality on the results page.

## Phase 3: Internationalization (i18n)
- [x] Verify that UI text translates correctly on the homepage.
- [x] Verify that UI text translates correctly during the assessment.
- [x] Verify that UI text translates correctly on the results page.
- [x] Verify that the exported PDF content is correctly translated.

## Phase 4: Static Pages & Footer
- [x] Test navigation to the Privacy Policy page from the footer.
- [x] Test navigation to the Terms of Service page from the footer.
- [x] Test theme toggle (light/dark mode) and ensure it persists across pages.

## Completed Tasks
- [x] Create a TODO list plan for testing the main functionality of the app.
- [x] Add a language switcher to the UI.
- [x] Fix footer layout for mobile responsiveness.
      