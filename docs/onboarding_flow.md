# Developer Documentation: Onboarding Flow

This document outlines the architecture and state management of the user onboarding experience in Lexity.

## Overview

The onboarding process has transitioned from a single, blocking modal wizard to a contextual, tooltip-driven tour. This new system is designed to be more engaging, less intrusive, and resilient to users navigating away and coming back.

The entire flow is managed by the **`useOnboardingStore`** (a Zustand store), which acts as a global state machine.

## State Management (`useOnboardingStore`)

The store holds the current `step` of the user's onboarding journey. The `isActive` flag indicates whether any onboarding UI should be active.

-   **`step`**: An enum of type `OnboardingStep` that determines which tooltip or modal is currently visible.
-   **`isActive`**: A boolean derived from the `step`. If `step` is anything other than `INACTIVE`, `isActive` is `true`.
-   **`onboardingJournalId`**: Stores the ID of the user's first journal entry to guide them back to it.
-   **`determineCurrentStep`**: The core logic function. It takes the user's profile and journal history as input and calculates which step the user should be on. This function is called by the `StoreInitializer` on every app load, making the flow resilient.

## The Flow (State Transitions)

1.  **`PROFILE_SETUP`**:
    -   **Trigger**: A new user signs up. The `determineCurrentStep` function sees that `nativeLanguage` is not set on their profile.
    -   **UI**: The `<LanguageSetupDialog>` is displayed on key pages (`/dashboard`, `/journal`, etc.).
    -   **Transition**: When the user saves their languages, the `useOnboardUser` hook updates their profile. On the next render, `determineCurrentStep` sees a complete profile and moves the state to `FIRST_JOURNAL`.

2.  **`FIRST_JOURNAL`**:
    -   **UI**: A `<GuidedPopover>` appears on `/journal`, pointing to the `JournalEditor`.
    -   **Transition**: When the user starts typing in the editor (`onFirstUpdate` prop), the step is advanced to `VIEW_ANALYSIS`.

3.  **`VIEW_ANALYSIS`**:
    -   **UI**: A `<GuidedPopover>` appears on `/journal/[id]`, pointing to the `AnalysisDisplay`.
    -   **Transition**: When the user dismisses this popover (by clicking anywhere), the step advances to `CREATE_DECK`.

4.  **`CREATE_DECK`**:
    -   **UI**: A `<GuidedPopover>` appears on the "Add to Study Deck" button within the first `FeedbackCard`.
    -   **Transition**: When the user clicks the button, the `onOnboardingAddToDeck` callback advances the step to `STUDY_INTRO`.

5.  **`STUDY_INTRO` -> `READ_WRITE_INTRO` -> `DRILL_INTRO`**:
    -   These steps follow a similar pattern of showing a popover on one page (`/study`, `/read`), and the user's core action (reviewing a card, submitting an entry) triggers the transition to the next step, often involving a modal prompt to navigate to the next page.

6.  **`COMPLETED`**:
    -   **UI**: The final modal appears, prompting the user to finish.
    -   **Transition**: Clicking "Explore Dashboard" calls the `useCompleteOnboarding` mutation, which sets `onboardingCompleted: true` on the user's profile in the database and calls `resetOnboarding()` on the store, setting the step to `INACTIVE`.

## UI Components

-   **`<GuidedPopover>`**: The primary UI for contextual tooltips. It wraps a target component and displays a message based on the `isOpen` prop.
-   **`<OnboardingChecklist>`**: A persistent, dismissible component that shows the user their overall progress in the tour. It reads its state from `useOnboardingStore` and uses `localStorage` to handle its dismissed state.

## Restarting the Tour

The "Restart Onboarding Tour" button in Settings does three things:
1.  Calls an API endpoint (`/api/user/reset-onboarding`) to set `onboardingCompleted` back to `false`.
2.  Clears the `localStorage` key for the dismissed checklist.
3.  Resets the `useOnboardingStore` state and invalidates the user profile query, which causes the `StoreInitializer` to re-run `determineCurrentStep` and restart the tour.