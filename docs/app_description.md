
# **Health Risk Assessor: Technical Application Description (v1.1)**

## 1. Vision & Architectural Philosophy

**Health Risk Assessor** is a **Progressive Web App (PWA)** designed to **provide users with an anonymous, scientifically-grounded assessment of their personal health risks for common cancers**. Our architecture prioritizes **user trust through absolute anonymity**, **ethical responsibility in presenting health information**, and a **calm, clear user experience**.

The core philosophy is to **serve as a catalyst for proactive health**. We believe that by providing accessible and understandable risk information, we can empower individuals to have more informed and productive conversations with their healthcare providers. This application is designed not as a diagnostic tool, but as a **digital companion for proactive health** to help users **take the first step in understanding and managing their health risks**.

Furthermore, we are committed to **uncompromising data privacy**. Our **Public Good / Non-commercial** model directly addresses this by ensuring that the core experience is 100% free and anonymous, with no user data ever sold. The application is designed to be a trusted resource, funded by [Client/Organization Name], with user well-being as its only goal.

## 2. Architectural Overview

The system is designed around a **session-based, largely stateless architecture** within a **Next.js monorepo**. This approach leverages **server components for a fast initial load** and **a dedicated API service for processing assessments in-memory**. A small-footprint **operational database** is used for non-user data like anonymous event logging and questionnaire versioning, but **no user-inputted health data is ever stored**, creating a secure and performant environment that enforces anonymity.

```mermaid
graph TD
    subgraph User Device
        A[Client App (PWA) on Browser/Mobile]
    end

    subgraph Hosting / Frontend Layer (Vercel)
        B([Next.js App])
    end
    
    subgraph Backend Services & APIs
        C{Assessment API (Next.js API Route)}
        H[Email Service (Resend)]
        J[Composite AI Service (Gemini, Groq...)]
        K[Operational DB (PostgreSQL)]
    end

    %% User Flows
    B -- Serves UI & Questionnaire Schema --> A
    A -- "Submits Questionnaire" --> C
    A -- "Requests Email Export" --> C

    %% Backend Flows
    C -- "Fetches Active Questionnaire" --> K
    C -- "Logs Anonymous Event" --> K
    C -- "Sends questionnaire data for analysis" --> J
    J -- "Returns structured risk profile" --> C
    C -- "Returns results to client" --> B
    C -- "Sends one-time email report" --> H
```

**Flow Description:**

1.  **Client:** The user interacts with the **Next.js** PWA. The app fetches the current questionnaire schema from the API, which loads it from the **Operational DB**. The state of the user's answers is managed client-side using **Zustand**.
2.  **Assessment Request:** Upon completion, the answers are sent to our **Next.js API Route**.
3.  **Application Backend:** The backend is **stateless regarding user data**. It receives the answers, formats them into a prompt, and sends it to the **Composite AI Service**. It **does not** write any user health information to the database. It does, however, write an anonymous event log (e.g., 'SUCCESS', 'AI_VALIDATION_ERROR') to the **Operational DB**.
4.  **Results:** The AI returns a structured JSON risk profile, which the API validates and sends back to the client for display.
5.  **Email Export (Optional):** If the user requests an email, the results and their provided email address are sent to a separate endpoint. This endpoint uses **Resend** to dispatch the email and immediately purges the email address from memory, adhering to our "Send-and-Forget" protocol.

## 3. Core Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+** | Provides a robust full-stack environment. Server components ensure a fast, non-interactive initial load, ideal for the welcome and results pages. |
| **Database** | **PostgreSQL** | Used for storing **operational data only**, such as anonymous event logs (`AssessmentLog`) and questionnaire versions (`Questionnaire`). Critically, it **does not store any user PII or health inputs**. |
| **ORM** | **Prisma** | Provides a type-safe interface to the operational PostgreSQL database for managing questionnaires and logs. |
| **Authentication** | **None** | The application is fully anonymous by design. |
| **Payments** | **None** | The tool is a free public service. |
| **AI / Core Engine**| **Composite AI Service (Gemini, Groq, Cerebras)** | A resilient, multi-provider service that sends requests to a primary AI model and automatically falls back to secondary providers on failure, ensuring high availability. |
| **Notifications** | **Resend API** | Used exclusively for the optional, one-time, "send-and-forget" email export feature, chosen for its simplicity and reliability. |
| **Styling** | **Tailwind CSS & shadcn/ui** | A utility-first framework and accessible component library allow for the rapid creation of a clean, calm, and responsive user interface. |
| **Deployment** | **Vercel** | Offers seamless integration with Next.js, serverless functions for our stateless API, and a global CDN for fast performance. |

## 4. Key NPM Libraries & Tooling

-   **State Management:** `Zustand` (Manages the state of the questionnaire across multiple steps on the client-side).
-   **State Persistence:** `zustand/middleware/persist` (Saves questionnaire progress to `localStorage`, allowing a user to refresh the page or return later and resume their session).
-   **Data Fetching & Mutation:** `@tanstack/react-query` (Handles API calls, including loading and error states for fetching the questionnaire and submitting the assessment).
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

Given our commitment to anonymity, we will not track individual users. Success will be measured through aggregated, anonymous event data stored in our operational `AssessmentLog` table:

*   **Completion Rate:** The percentage of sessions that start the questionnaire and reach the results page. This is our primary KPI for user engagement and trust.
*   **Export Rate:** The percentage of completed assessments that result in a PDF download or an email export. This measures how actionable users find the results.
*   **Drop-off Analysis:** Anonymous tracking of which questionnaire step has the highest exit rate, allowing us to identify and improve confusing or sensitive questions.
*   **Performance Metrics:** Core Web Vitals and API response times, monitored via Vercel Analytics.

## 6. High-Level Database Schema

To support operational needs without compromising user anonymity, the application uses a minimal database schema. **This database never stores user-inputted health data, PII, or assessment results.**

```prisma
// prisma/schema.prisma

// Logs the status of an assessment attempt for monitoring.
// Contains no user data.
model AssessmentLog {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  status    String // e.g., "SUCCESS", "AI_VALIDATION_ERROR"
}

// Stores different versions of the questionnaire, allowing
// for updates without deploying new code.
model Questionnaire {
  id        String   @id @default(cuid())
  version   Int      @unique
  isActive  Boolean  @default(false)
  content   Json
  createdAt DateTime @default(now())
}
```

## 7. Development Epics & User Stories

### **Epic 1: Core Anonymous Experience**
- **[RISK-001]:** As a user, I can visit the welcome page and understand the tool's purpose and its commitment to anonymity.
- **[RISK-002]:** As a user, I can answer a series of health-related questions in a multi-step wizard.
- **[RISK-003]:** As a user, after completing the questionnaire, I can view a personalized risk dashboard with simple, clear results.
- **[RISK-004]:** As a user, if I close my browser and return later, I can resume my questionnaire from where I left off.

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
| **Dependency**| An AI provider experiences an outage, has policy changes, or degrades in quality. | The implemented **`CompositeAIService` provides a resilient, multi-provider fallback system**. If the primary provider (e.g., Gemini) fails, the service automatically and seamlessly retries the request with a secondary provider (e.g., Groq), ensuring high availability and mitigating dependency risk. |
| **Compliance** | The application is misconstrued as a medical device, creating potential liability. | Work with legal counsel to craft disclaimer language. Emphasize the tool's purpose as a conversation starter for users *and their doctors*. |

## 11. Future Scope & Roadmap Ideas

*A parking lot for ideas to be considered post-MVP.*

-   Expand the assessment to include a wider range of cancer types or health conditions.
-   Localize the application into multiple languages to increase accessibility.
-   Provide more granular, personalized links to resources based on specific risk factors identified.
-   Develop a separate, secure version for use by healthcare providers in a clinical setting (with patient consent).