
# **Health Risk Assessor: Technical Application Description (v1)**

## 1. Vision & Architectural Philosophy

**Health Risk Assessor** is a **Progressive Web App (PWA)** designed to **provide users with an anonymous, scientifically-grounded assessment of their personal health risks for common cancers**. Our architecture prioritizes **user trust through absolute anonymity**, **ethical responsibility in presenting health information**, and a **calm, clear user experience**.

The core philosophy is to **serve as a catalyst for proactive health**. We believe that by providing accessible and understandable risk information, we can empower individuals to have more informed and productive conversations with their healthcare providers. This application is designed not as a diagnostic tool, but as a **digital companion for proactive health** to help users **take the first step in understanding and managing their health risks**.

Furthermore, we are committed to **uncompromising data privacy**. Our **Public Good / Non-commercial** model directly addresses this by ensuring that the core experience is 100% free and anonymous, with no user data ever stored or sold. The application is designed to be a trusted resource, funded by [Client/Organization Name], with user well-being as its only goal.

## 2. Architectural Overview

The system is designed around a **session-based, stateless architecture** within a **Next.js monorepo**. This approach leverages **server components for a fast initial load** and **a dedicated API service for processing assessments in-memory**, creating a secure and performant environment that enforces anonymity.

```mermaid
graph TD
    subgraph User Device
        A[Client App (PWA) on Browser/Mobile]
    end

    subgraph Hosting / Frontend Layer (Vercel)
        B([Next.js App])
        B -- Serves UI --> A
        B -- API Calls --> C
    end

    subgraph Backend Services & APIs
        C{ Assessment API (Next.js API Route) }
        H[Email Service (Resend)]
        J[AI Risk Assessment Service (e.g., Gemini API)]
    end

    %% User Flows
    A -- "Submits Questionnaire" --> C
    A -- "Requests Email Export" --> C

    %% Backend Flows
    C -- "Sends questionnaire data for analysis" --> J
    J -- "Returns structured risk profile" --> C
    C -- "Returns results to client" --> A
    C -- "Sends one-time email report" --> H
```

**Flow Description:**

1.  **Client:** The user interacts with the **Next.js** PWA, answering questions. The state of the questionnaire is managed client-side using **Zustand**.
2.  **Assessment Request:** Upon completion, the questionnaire answers are sent to our **Next.js API Route**.
3.  **Application Backend:** The backend is **stateless**. It receives the data, formats it into a prompt based on vetted medical risk models, and sends it to the **AI Risk Assessment Service**. It **does not** write any of this information to a database.
4.  **Results:** The AI returns a structured JSON risk profile, which the API validates and sends back to the client for display on the results dashboard.
5.  **Email Export (Optional):** If the user requests an email, the results and their provided email address are sent to a separate endpoint. This endpoint uses **Resend** to dispatch the email and immediately purges the email address from memory, adhering to our "Send-and-Forget" protocol.

## 3. Core Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+** | Provides a robust full-stack environment. Server components ensure a fast, non-interactive initial load, ideal for the welcome and results pages. |
| **Database** | **No Persistent User Database** | This is a core architectural choice to guarantee user anonymity and trust. All data is processed in-memory per session. |
| **ORM** | **None** | Prisma is removed as we do not store user data, simplifying the stack and reinforcing our privacy commitment. |
| **Authentication** | **None** | The application is fully anonymous by design. Supabase Auth has been removed. |
| **Payments** | **None** | The tool is a free public service. Stripe has been removed. |
| **AI / Core Engine**| **Google Gemini API** | Chosen for its advanced reasoning capabilities to process health inputs according to established risk models and return structured, reliable assessment data in a consistent JSON format. |
| **Notifications** | **Resend API** | Used exclusively for the optional, one-time, "send-and-forget" email export feature, chosen for its simplicity and reliability. |
| **Styling** | **Tailwind CSS & shadcn/ui** | A utility-first framework and accessible component library allow for the rapid creation of a clean, calm, and responsive user interface. |
| **Deployment** | **Vercel** | Offers seamless integration with Next.js, serverless functions for our stateless API, and a global CDN for fast performance. |

## 4. Key NPM Libraries & Tooling

-   **State Management:** `Zustand` (Manages the state of the questionnaire across multiple steps on the client-side).
-   **State Persistence:** `zustand/middleware/persist` (To save questionnaire progress to `sessionStorage`, allowing a user to refresh the page without losing their answers. The data is cleared once the session ends).
-   **Data Fetching & Mutation:** `@tanstack/react-query` (Handles the API call to the assessment endpoint, including loading and error states).
-   **Schema Validation:** `Zod` (Ensures the data sent to the AI and, critically, the data received from the AI, conforms to a strict, expected structure).
-   **UI Components:** `shadcn/ui` (Provides the accessible, high-quality building blocks for the UI, such as cards, sliders, and progress bars).
-   **PDF Generation:** `jspdf` & `jspdf-autotable` (Client-side libraries to generate the downloadable "Doctor's Visit Companion" report).

## 4.5. Data Source & Assessment Logic

The integrity of our assessment relies on established, peer-reviewed medical research. The questionnaire logic and risk factor weighting will not be invented by our team but will be based on:

*   **Established Risk Models:** We will implement logic derived from publicly available and validated risk assessment models (e.g., the [Gail Model](https://www.cancer.gov/bcrisktool/) for breast cancer, or similar established models for other cancer types).
*   **Medical Advisor Review:** All questions, risk factors, and the final "Doctor's Visit Companion" report format will be reviewed and approved by a qualified medical advisor to ensure the information is presented responsibly and accurately.
*   **AI's Role:** The AI's function is not to create new medical science, but to process the user's inputs according to the pre-defined, vetted logic of these models and present the results in a clear, understandable format. The core prompt will be engineered to strictly follow this logic.

## 5. Monetization Strategy: Public Good / Non-commercial

The application uses a **Public Good / Non-commercial** model. There is no monetization strategy. The tool is provided as a free public service to empower individuals with health information and encourage proactive conversations with healthcare professionals.

| Tier | Price | Key Features | Target Audience |
| :--- | :--- | :--- | :--- |
| **Standard Access** | Free | • Anonymous risk assessment<br>• Personalized results dashboard<br>• Optional PDF & email export<br>• Links to health resources | The general public seeking to better understand their personal health risk factors. |

## 5.5. Measuring Success (Anonymously)

Given our commitment to anonymity, we will not track individual users. Success will be measured through aggregated, anonymous event data:

*   **Completion Rate:** The percentage of sessions that start the questionnaire and reach the results page. This is our primary KPI for user engagement and trust.
*   **Export Rate:** The percentage of completed assessments that result in a PDF download or an email export. This measures how actionable users find the results.
*   **Drop-off Analysis:** Anonymous tracking of which questionnaire step has the highest exit rate, allowing us to identify and improve confusing or sensitive questions.
*   **Performance Metrics:** Core Web Vitals and API response times, monitored via Vercel Analytics.

## 6. High-Level Database Schema

The application is designed to be **stateless** regarding user data. **There is no persistent database schema for user-submitted information.** All questionnaire data is processed in-memory for the duration of the user's session and is never written to a database. This is a fundamental design choice to guarantee user anonymity.

## 7. Development Epics & User Stories

### **Epic 1: Core Anonymous Experience**
- **[RISK-001]:** As a user, I can visit the welcome page and understand the tool's purpose and its commitment to anonymity.
- **[RISK-002]:** As a user, I can answer a series of health-related questions in a multi-step wizard.
- **[RISK-003]:** As a user, after completing the questionnaire, I can view a personalized risk dashboard with simple, clear results.

### **Epic 2: Results Export & Actionability**
- **[RISK-010]:** As a user, I can download my results as a professionally formatted PDF ("Doctor's Visit Companion").
- **[RISK-011]:** As a user, I can optionally enter my email to receive a one-time copy of my results.
- **[RISK-012]:** As a user, I can view additional in-app resources and "conversation starters" related to my results.

### **Epic 3: Trust, Compliance & UI**
- **[RISK-020]:** As a user, I see clear disclaimers stating the tool is not for diagnosis before, during, and after the assessment.
- **[RISK-021]:** As a developer, the "send-and-forget" email endpoint is implemented to ensure no email addresses are ever stored.
- **[RISK-022]:** As a user, I experience a calm, reassuring, and accessible interface on both mobile and desktop.

## 8. Development & Compliance Practices

### 8.1. UI/UX Philosophy
The application will be built with a **mobile-first** philosophy. The UI will be clean, simple, and reassuring, designed to reduce anxiety and build trust. All interactions will be optimized for clarity and ease of use.

### 8.2. Code Quality & Best Practices
-   **Folder Structure:** We will follow a feature-based structure (`/app/assessment`, `/app/results`).
-   **Anonymity:** No personally identifiable information (PII) or user-inputted health data will be logged or stored. The "Send-and-Forget" protocol for email is a critical practice.
-   **Type Safety:** We will use Zod to ensure end-to-end type safety for API requests and, most importantly, for validating the structure of the AI's response.

### 8.3. Accessibility (A11y)
-   **Goal:** The application will strive to meet **WCAG 2.1 AA** standards.
-   **Implementation:** We will use semantic HTML, ensure full keyboard navigability, provide appropriate ARIA attributes, and use high-contrast, legible typography, leveraging the accessible foundation of **shadcn/ui**.

### 8.4. Observability Strategy
-   **Error Tracking:** We will integrate **Sentry** to capture and report anonymous, unhandled exceptions to maintain application health without compromising user privacy.
-   **PII Redaction:** All logging and error tracking will be configured to avoid capturing user-inputted health data. Sentry's server-side scrubbing rules will be implemented to filter out any potentially sensitive data before it leaves the user's environment.
-   **Performance Monitoring:** We will leverage **Vercel Analytics** to monitor Core Web Vitals and overall application performance. No user-identifying product analytics will be used.

## 9. MVP Scope & Phasing

Our immediate goal is to launch an MVP that validates the core user proposition: **users will trust and complete an anonymous questionnaire if it provides clear, actionable health risk information.**

### Phase 1: MVP (Target: [Date/Quarter])
-   **Focus:** The core anonymous user flow: Welcome -> Questionnaire -> Results Dashboard.
-   **Epics to be Completed:** Epic 1 and Epic 3.

### Phase 2: Post-MVP (First Major Update)
-   **Focus:** Adding user-controlled export functionality and enhancing the actionability of the results.
-   **Epics to be Implemented:** Epic 2.

## 10. Potential Risks & Mitigation

| Risk Category | Risk Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Technical / Ethical** | The AI provides inaccurate, alarming, or clinically incorrect risk assessments. | Rigorous prompt engineering with clear guardrails and few-shot examples to ensure consistent JSON output. Prominently display disclaimers that the tool is not medical advice. Frame results as "risk factors" and "statistical profiles," not diagnoses. The AI's output will be validated against a Zod schema before being shown to the user; if validation fails, a generic 'could not process' message is shown instead of a malformed result. |
| **Product / Trust** | Users do not trust the "anonymity" promise and abandon the questionnaire. | Be radically transparent in the UI about the stateless nature of the app. Clearly explain the "Send-and-Forget" protocol. Avoid any unnecessary data collection. |
| **Dependency**| The AI provider (e.g., Google) changes its data retention policies to store prompt data, conflicting with our anonymity promise. | Actively monitor provider terms of service. The `CompositeAIService` from the original codebase can be retained as an abstraction layer, allowing us to swap AI providers with minimal code changes if a policy conflict arises. Prioritize providers with zero-data-retention policies. |
| **Compliance** | The application is misconstrued as a medical device, creating potential liability. | Work with legal counsel to craft disclaimer language. Emphasize the tool's purpose as a conversation starter for users *and their doctors*. |

## 11. Future Scope & Roadmap Ideas

*A parking lot for ideas to be considered post-MVP.*

-   Expand the assessment to include a wider range of cancer types or health conditions.
-   Localize the application into multiple languages to increase accessibility.
-   Provide more granular, personalized links to resources based on specific risk factors identified.
-   Develop a separate, secure version for use by healthcare providers in a clinical setting (with patient consent).