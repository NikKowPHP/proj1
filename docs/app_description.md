# **Proactive Health Planner: Technical Application Description (v2.0)**

## 1. Vision & Architectural Philosophy

**Proactive Health Planner** is a **Progressive Web App (PWA)** designed to provide users with an **anonymous, personalized, and actionable preventive health plan**. Our architecture prioritizes **user trust through absolute anonymity**, **ethical responsibility in presenting health information**, and a **calm, clear user experience**.

The core philosophy is to **serve as a catalyst for proactive health**. Instead of calculating abstract risk scores, the application uses a **deterministic guideline engine** to generate specific, actionable recommendations based on established public health guidelines. An AI layer then acts as a "compassionate explainer" to make these recommendations understandable and personal. The tool is designed not as a diagnostic device, but as a **digital companion for generating a "Doctor's Discussion Guide"** to facilitate productive conversations with healthcare providers.

Our **Public Good / Non-commercial** model ensures the core experience is 100% free and anonymous, with user well-being as its only goal.

## 2. Architectural Overview

The system uses a **multi-stage, fully stateless architecture** within a **Next.js monorepo**. This approach first standardizes raw user input, calculates derived health metrics, runs a deterministic rules engine to generate a plan, and finally uses an AI service to explain it. This hybrid model ensures that the core recommendations are based on auditable, hard-coded public health guidelines, while the user experience remains personalized and easy to understand. **No database is used, and no user-inputted health data is ever stored on the server.**

```mermaid
graph TD
    subgraph User Device
        A[Client App (PWA) on Browser/Mobile]
    end

    subgraph Hosting / Frontend Layer (Vercel)
        B([Next.js App])
    end
    
    subgraph Backend Services & APIs
        C{Planner API (Next.js API Route)}
        S[Standardization Service]
        V[Derived Variables Service]
        D[Guideline Engine (Deterministic)]
        H[Email Service (Resend)]
        J[AI Explainer Service (Gemini, Groq...)]
    end

    %% User Flows
    B -- Serves UI & Questionnaire Schema --> A
    A -- "Submits Answers" --> C

    %% Backend Flows
    C -- "Processes answers with" --> S
    S -- "Returns Structured Data (Core/Advanced)" --> V
    V -- "Calculates Age, BMI, etc." --> D
    D -- "Returns Guideline Plan (Action IDs)" --> C
    C -- "Assembles final payload for AI" --> J
    J -- "Returns user-friendly text (ActionPlan)" --> C
    C -- "Returns full ActionPlan to client" --> B
    A -- "Requests Email Export" --> C
    C -- "Sends one-time email report" --> H
```

**Flow Description:**

1.  **Client:** The user interacts with the **Next.js** PWA, filling out a comprehensive form covering core demographics, lifestyle, and optional advanced modules (e.g., Family History, Genetics, Occupational Hazards).
2.  **Submission:** The flat answers object is sent to our **Next.js API Route**.
3.  **Standardization:** The API first uses the `StandardizationService` to transform the flat answers into a structured `core` and `advanced` data object.
4.  **Derivation:** The structured data is passed to the `DerivedVariablesService` to calculate key metrics like `age_years`, `bmi`, and `pack_years`.
5.  **Guideline Engine:** The API then passes the original answers and the derived variables to the **deterministic Guideline Engine**. This engine checks the data against a set of rules defined in `preventive-plan-config.json` and outputs a structured set of action IDs (e.g., `{ screenings: ["COLORECTAL_CANCER_SCREENING"] }`).
6.  **AI Explainer:** The API assembles a final, rich payload containing the standardized data, derived variables, and the guideline plan, and sends it to the **Composite AI Service**. The AI's sole job is to translate these action IDs into compassionate, user-friendly text, generating the final `ActionPlan`.
7.  **Response:** The `ActionPlan` is validated via Zod and sent back to the client for display. No data is persisted on the server.
8.  **Email Export (Optional):** If requested, the client sends the `ActionPlan` and the user's answers to an endpoint that uses **Resend** to dispatch the email and immediately purges the email address from memory.

## 3. Core Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+** | Full-stack environment ideal for a fast initial load and serverless API functions. |
| **Core Logic** | **Deterministic Rules Engine** | A custom service (`guideline-engine.service.ts`) that processes answers against a JSON config of public health rules. Ensures core recommendations are accurate, auditable, and not subject to AI variability. |
| **AI Layer**| **Composite AI Service (Gemini, Groq, etc.)** | A resilient, multi-provider service used *only* to explain the output of the rules engine. This separation of concerns is critical for safety and reliability. |
| **Notifications** | **Resend API** | Used exclusively for the optional, one-time, "send-and-forget" email export. |
| **Styling** | **Tailwind CSS & shadcn/ui** | A utility-first framework and accessible component library for rapid UI development. |
| **Deployment** | **Vercel** | Seamless integration with Next.js, serverless functions for our stateless API, and a global CDN. |

## 4. Key NPM Libraries & Tooling

-   **State Management:** `Zustand` & `zustand/middleware/persist` (Manages questionnaire state client-side and persists it to `localStorage` to allow session resumption).
-   **Data Fetching:** `@tanstack/react-query` (Handles API calls for fetching the questionnaire and submitting the plan request).
-   **Schema Validation:** `Zod` (Ensures the data from the AI conforms to the strict `ActionPlan` structure before being sent to the client).
-   **PDF Generation:** `jspdf` & `jspdf-autotable` (Client-side libraries to generate the "Doctor's Discussion Guide" PDF).

## 4.5. Data Source & Logic

The integrity of our recommendations relies on established public health guidelines.
*   **Guideline Configuration:** The application's logic is defined in `preventive-plan-config.json`. This file contains a series of rules that map user answers (e.g., age, smoking status) to specific action IDs. These rules are based on guidelines from reputable sources like the CDC and American Cancer Society.
*   **Medical Advisor Review:** All rules in the configuration file and the final "Doctor's Discussion Guide" format will be reviewed and approved by a qualified medical advisor.
*   **AI's Role:** The AI's function is strictly limited to generating explanatory text for the pre-determined action IDs from the guideline engine. It does not create new recommendations or calculate risk. This makes the system's core logic transparent and safe.

## 5. Monetization Strategy: Public Good / Non-commercial

The application is a free public service. There is no monetization.

| Tier | Price | Key Features | Target Audience |
| :--- | :--- | :--- | :--- |
| **Standard Access** | Free | • Anonymous plan generation<br>• Personalized action plan<br>• Optional PDF & email export<br>• Links to health resources | The general public. |

## 5.5. Measuring Success (Anonymously)

Success is measured through aggregated, anonymous data from our hosting and monitoring platforms:
*   **Completion Rate:** Percentage of sessions that start the questionnaire and generate a plan (tracked via anonymous analytics events).
*   **Export Rate:** Percentage of completed plans that result in a PDF or email export.
*   **Performance Metrics:** Core Web Vitals and API response times via Vercel Analytics.
*   **System Health:** Error rates and API status are monitored via Sentry.

## 6. High-Level Database Schema

There is no database schema as the application is fully stateless and does not persist any user or operational data on a server-side database.

## 7. Development & Compliance Practices

### 7.1. UI/UX Philosophy
The application is built **mobile-first** with a clean, simple, and reassuring UI designed to reduce anxiety and build trust.

### 7.2. Code Quality & Best Practices
-   **Anonymity:** No personally identifiable information (PII) or user-inputted health data is logged or stored. The "Send-and-Forget" protocol for email is a critical practice.
-   **Type Safety:** Zod ensures end-to-end type safety, especially for validating the AI's response structure.

### 8.3. Accessibility (A11y)
-   **Goal:** Strive to meet **WCAG 2.1 AA** standards, leveraging the accessible foundation of **shadcn/ui**.

### 8.4. Observability Strategy
-   **Error Tracking:** **Sentry** is integrated to capture anonymous, unhandled exceptions.
-   **PII Redaction:** Sentry is configured with server-side scrubbing rules to filter out any potentially sensitive data before it leaves the user's environment.
-   **Performance Monitoring:** **Vercel Analytics** is used to monitor Core Web Vitals. No user-identifying product analytics are used.
      