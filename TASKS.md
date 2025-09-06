### Implementation Plan: Comprehensive UI/UX Redesign for ONKONO

This plan outlines the steps to redesign the existing "Proactive Health Planner" application, refactoring the UI/UX to precisely match the provided screenshot, including a new two-column layout, dark theme with red accents, and updated branding across the entire application.

#### Phase 1: Global Theming, Branding, and Layout
*(Goal: Establish the new visual identity and apply it consistently across the application.)*

-   [x] **1.1. Update Global Theme**
    -   [x] Open `src/app/globals.css`.
    -   [x] In the `:root` and `.dark` selectors, replace the existing color palette.
        -   [x] Set `--background` to a near-black color (e.g., `hsl(0 0% 8%)`).
        -   [x] Set `--foreground` to a light gray/white (e.g., `hsl(0 0% 98%)`).
        -   [x] Set `--card` and `--popover` to a slightly lighter dark shade (e.g., `hsl(0 0% 12%)`).
        -   [x] Set `--primary` and `--ring` to a vibrant red to match the screenshot's accent (e.g., `hsl(0 84% 60%)`).
        -   [x] Set `--destructive` to the same red, as it serves the same purpose in this design.
        -   [x] Adjust `--input`, `--border`, `--secondary`, and `--muted` to use subtle dark grays that work with the new theme (e.g., `hsl(0 0% 15%)`).

-   [x] **1.2. Update Branding Assets and Metadata**
    -   [x] **ASSUMPTION:** A new logo file `onkono.svg` and a new set of favicons will be provided.
    -   [x] Replace the contents of the `public/favicon/` directory with the new ONKONO icons.
    -   [x] Replace `public/next.svg` and `public/vercel.svg` with the `onkono.svg` file or delete if unused.
    -   [x] Open `src/app/[locale]/layout.tsx` and update the `metadata` object's `title` and `description` to "ONKONO" and its new tagline.
    -   [x] Update `public/manifest.json` and `public/site.webmanifest` with the new branding.

-   [x] **1.3. Restructure Core Layouts**
    -   [x] Open `src/app/[locale]/page.tsx` (Home Page) and update the layout and branding to match the new "ONKONO" identity, removing the old "Proactive Health Planner" hero section.
    -   [x] Open `src/app/[locale]/assessment/page.tsx`.
        -   [x] Implement the two-column CSS Grid layout: `<div className="grid md:grid-cols-2 min-h-screen">`.
        -   [x] Create the left column with the ONKONO logo, tagline, and the important disclaimer section (styling it with the new red accent color).
        -   [x] Move the assessment form into the right column.
    -   [x] Open `src/components/AppFooter.tsx` and replace the copyright text with "ONKONO".
    -   [x] Open `src/components/LanguageSwitcher.tsx` and refactor it from a `Select` dropdown to a simple `PL | EN` text-based switcher using `Link` components to match the screenshot.

#### Phase 2: Refactor UI Components for the New Design System
*(Goal: Update shared components to reflect the new aesthetic, ensuring consistency and reusability.)*

-   [x] **2.1. Update `shadcn/ui` Component Styles**
    -   [x] **Button:** Open `src/components/ui/button.tsx`. Modify the `default` variant to use the new red primary color.
    -   [x] **Input:** Open `src/components/ui/input.tsx`. Modify the base styles to match the screenshot's dark, borderless look.
    -   [x] **Select:** Open `src/components/ui/select.tsx`. Update `SelectTrigger` styles to match the borderless, dark aesthetic.
    -   [x] **Tabs:** Open `src/components/ui/tabs.tsx`. Update `TabsList` and `TabsTrigger` to create the full-width, segmented control style seen in the screenshot for the "Units" selection.
    -   [x] **Card:** Open `src/components/ui/card.tsx`. Ensure the default card styles align with the new dark theme for use on other pages like the results page.

-   [x] **2.2. Rebuild the Assessment Form**
    -   [x] Open `src/app/[locale]/assessment/page.tsx`.
    -   [x] Remove the main `Card` wrapper from the form.
    -   [x] Replace `CardHeader`, `CardContent`, and `CardFooter` with semantic `div`s.
    -   [x] The form components (`Input`, `Select`, `Button`, `Tabs`) should now inherit the new styles from the updated UI components, requiring minimal override classes.

#### Phase 3: Update and Harmonize All Pages
*(Goal: Ensure every page in the application is visually consistent with the new brand identity.)*

-   [x] **3.1. Redesign Results Page**
    -   [x] Open `src/app/[locale]/results/page.tsx`.
    -   [x] Refactor the page to use the new themed components (`Card`, `Button`, etc.) so its appearance matches the new dark, red-accented theme.
    -   [x] Ensure the `ActionPlanDisplay.tsx` and its child components (`RecommendedScreenings.tsx`, etc.) render correctly with the new styles.

-   [x] **3.2. Redesign Static Pages**
    -   [x] Open `src/app/[locale]/privacy/page.tsx` and `src/app/[locale]/terms/page.tsx`.
    -   [x] Ensure the prose styles and the "Back to Home" button are updated automatically by the global theme changes. Manually adjust any styles that are not inheriting correctly.

#### Phase 4: Testing and Validation
*(Goal: Verify that the redesigned application is fully functional and visually correct.)*

-   [x] **4.1. Update End-to-End Tests**
    -   [x] Open `e2e/assessment.spec.ts`.
        -   [x] Update selectors to account for the removal of the `Card` component structure.
        -   [x] Add an assertion to verify the "ONKONO" logo is visible on the assessment page.
    -   [x] Open `e2e/features.spec.ts`.
        -   [x] Review the footer navigation test. Update the language switcher part of the test to click on text links instead of a select dropdown.
        -   [x] Ensure the theme toggle test still passes.

-   [x] **4.2. Manual Cross-Browser and Responsive Testing**
    -   [x] Perform a full walkthrough of the user journey (Home -> Assessment -> Results) on Chrome, Firefox, and Safari.
    -   [x] Test on both desktop and mobile viewports, paying close attention to the two-column layout collapsing correctly on mobile.
    -   [x] Verify that all interactive elements (buttons, inputs, language switcher) are styled correctly and are fully functional.
      