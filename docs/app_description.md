
# **Lexity: Technical Application Description (v9 - Final)**

## 1. Vision & Architectural Philosophy

Lexity is a Progressive Web App (PWA) designed to revolutionize language learning by shifting the focus from passive consumption to active creation. Our architecture prioritizes a stellar developer experience, type-safety, and modularity to ensure long-term maintainability and scalability.

The application leverages a deeply integrated AI core to provide a personalized, adaptive, and effective writing-centric learning experience. Users improve by doing—receiving instant, contextual feedback, engaging in **robust drilling exercises on their specific mistakes**, and visualizing their **predicted path to fluency**.

## 2. Architectural Overview

The system is designed around a clean separation of concerns within a Next.js monorepo, simplifying the development lifecycle while maintaining modularity.

```mermaid
graph TD
    subgraph User Device
        A[PWA on Browser/Mobile]
    end

    subgraph Vercel/Hosting
        B(Next.js App)
        B -- Serves UI --> A
        B -- API Routes --> C
    end

    subgraph Backend Services
        C{Lexity API (Next.js API Routes)}
        D[Supabase Auth]
        E[Supabase Storage Bucket]
        F[PostgreSQL DB (via prisma)]
        G[Complex AI (Gemini)]
        G_FAST[Fast Translation AI (Cerebras/Groq)]
        H[Stripe API]
    end

    A -- "Signs In/Up" --> D
    A -- "Submits Journal" --> C
    A -- "Upgrades Plan" --> H

    C -- "Verifies User JWT" --> D
    C -- "CRUD (Journals, Analytics)" --> F
    C -- "Detailed Analysis, Generation" --> G
    C -- "High-speed Translation" --> G_FAST
    C -- "Manages Subscription Status" --> H

    subgraph Database Layer
      F -- "Managed by Prisma ORM" --> C
    end
```

**Flow Description:**

1.  **Client (PWA):** The user interacts with the Next.js frontend, rendered server-side for performance. The Supabase client-side library handles authentication directly.
2.  **Authentication & Storage:** Supabase provides a complete BaaS for user management (Auth) and file storage (Bucket) for potential future features.
3.  **Application Backend (Next.js API Routes):** Core logic resides here. API routes validate user sessions, perform AI processing by calling various AI services, and use Prisma to manage data in the PostgreSQL database.
4.  **Database Interaction:** Prisma acts as the type-safe bridge between API logic and the PostgreSQL database.
5.  **Multi-Provider AI Strategy:** The system utilizes a sophisticated, multi-provider AI strategy to balance cost, speed, and capability.
    *   **Complex Tasks:** `getQuestionGenerationService` (`src/lib/ai/index.ts`) abstracts the use of powerful models like **Google Gemini** for nuanced tasks like journal analysis and practice generation.
    *   **High-Speed Translation:** `getTranslationService` (`src/lib/ai/index.ts`) provides a `CompositeTranslationService` that uses a fast primary provider (**Cerebras**) with a fallback (**Groq**) to ensure immediate translation results in features like the standalone Translator.
6.  **Payment Processing:** Stripe handles all payment and subscription management, with our backend listening to Stripe webhooks to sync subscription states.

## 3. Core Tech Stack

| Component          | Technology                           | Rationale                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | **Next.js 15+ (App Router)**         | Unified frontend/backend, server components for performance, file-based routing, and a first-class developer experience.                                                                                                                                                                                                                                                     |
| **Database**       | **PostgreSQL**                       | Robust, reliable, and scalable SQL database with strong support for JSONB to store rich AI results.                                                                                                                                                                                                                                                                          |
| **ORM**            | **Prisma**                           | Provides ultimate type-safety between the database and application logic, auto-generated clients, and simplified migrations.                                                                                                                                                                                                                                                 |
| **Auth & Storage** | **Supabase (Auth & Bucket)**         | Offloads complex user management and file storage, providing secure, scalable, and easy-to-use SDKs.                                                                                                                                                                                                                                                                           |
| **Payments**       | **Stripe**                           | Industry leader for payment processing and subscription management with excellent developer tools and security.                                                                                                                                                                                                                                                              |
| **AI/LLM**         | **Multi-Provider Strategy**          | A hybrid approach to optimize for speed and capability: <br>• **Google Gemini:** Provides advanced reasoning for detailed journal analysis, mistake drill-downs, and content generation. <br>• **Cerebras/Groq:** A composite service provides high-speed, low-latency translations for the standalone Translator page, ensuring a responsive user experience.                 |
| **Styling**        | **Tailwind CSS + shadcn/ui**         | Utility-first CSS for rapid development. `shadcn/ui` provides unstyled, accessible, and composable components.                                                                                                                                                                                                                                                                 |
| **Deployment**     | **Vercel**                           | Native hosting for Next.js, offering seamless CI/CD, serverless functions, and global CDN.                                                                                                                                                                                                                                                                                   |

## 4. Key NPM Libraries & Tooling

- **Data Fetching & Mutation:** `@tanstack/react-query` (Manages server state, caching, and optimistic updates)
- **State Management:** `zustand` for client-side state (auth, onboarding), combined with React Query for server state
- **Schema Validation:** `zod` (TypeScript-first schema validation for API inputs and forms)
- **UI Components:** `shadcn/ui`, `lucide-react` (Accessible components and icons)
- **Editor:** `tiptap` (A headless, extensible rich text editor framework)
- **Data Visualization:** `recharts` (Composable charting library for analytics dashboards)
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`

## 5. Monetization Strategy: Value-Based Freemium

We use a **Value-Based Freemium** model integrated with Stripe Billing. The core analysis engine is **free and unlimited** to all users to encourage habit formation. Revenue is generated by offering powerful, real-time AI tools and advanced analytics to dedicated learners who want to accelerate their progress.

| Tier       | Price           | Key Features                                                                                                                                                                                                                                                                                                                                                                                                   | Target                                                                |
| :--------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| **Free**   | $0              | **Unlimited** journal submissions & analyses, standard AI feedback, topic tracking, **5 free AI interactions/day** (includes Autocomplete, Translation, and Practice Sessions), limited SRS (**10 card reviews/day**).                                                                                                                                                                                           | New users for acquisition and demonstrating core value.               |
| **Pro**    | ~$12-15 / month | All Free features, plus:<br>• **Unlimited** AI interactions (Translator, Autocomplete, Practice Sessions)<br>• **Unlimited** SRS access<br>• Advanced AI feedback (tone, style)<br>• Comprehensive analytics dashboard with progress forecasting<br>• Access to "Challenging Concepts" practice feature                                                                                                          | Dedicated, individual learners. Our primary offering.                 |
| **Expert** | ~$25-30 / month | All Pro features, plus specialized AI models (e.g., "Business English") and priority access to beta features.                                                                                                                                                                                                                                                                                                 | Professionals, academics, or highly advanced learners. (Future Scope) |

## 6. Key Learning Loops & Intelligence

Lexity's core value lies in its intelligent, interconnected features that create a powerful learning cycle.

-   **The Write -> Analyze -> Practice Loop:** This is the primary learning mechanism.
    1.  A user **writes** a journal entry.
    2.  The AI **analyzes** it, identifying specific mistakes.
    3.  For each mistake, the user can initiate a **Practice Session**. This triggers a robust AI-powered **drilling** feature that generates new, targeted exercises (e.g., fill-in-the-blanks, translations) to reinforce the correct concept.
    4.  The system tracks performance on these drills via the `PracticeAttempt` table. Concepts that the user consistently struggles with are surfaced on the dashboard as **"Challenging Concepts"**, creating a clear path for focused improvement.

-   **Adaptive Progression & Forecasting:** All user performance data—from journal scores to practice attempt results—feeds into our analytics engine.
    *   This data dynamically updates the user's `aiAssessedProficiency` for each language.
    *   For Pro users, we use this historical data to power a **hybrid forecasting model** (`src/lib/utils/forecasting.ts`). The model uses Holt's Linear Trend for early data and switches to a more sophisticated Holt's Damped Trend as more data becomes available, providing a realistic prediction of the user's path to fluency.

## 7. High-Level Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SrsItemType {
  MISTAKE
  TRANSLATION
  PRACTICE_MISTAKE
}

model User {
  id                    String    @id
  email                 String    @unique
  supabaseAuthId        String    @unique
  nativeLanguage        String?
  defaultTargetLanguage String?
  writingStyle          String?
  writingPurpose        String?
  selfAssessedLevel     String?
  status                String    @default("ACTIVE")
  lastUsageReset        DateTime?
  onboardingCompleted   Boolean   @default(false)

  // Monetization
  stripeCustomerId   String? @unique
  subscriptionTier   String  @default("FREE")
  subscriptionStatus String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  topics           Topic[]
  journalEntries   JournalEntry[]
  srsItems         SrsReviewItem[]
  languageProfiles LanguageProfile[]
  suggestedTopics  SuggestedTopic[]
}

model LanguageProfile {
  id                    String @id @default(cuid())
  userId                String
  user                  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  language              String
  aiAssessedProficiency Float  @default(2.0)
  proficiencySubScores  Json?

  @@unique([userId, language])
}

model Topic {
  id             String         @id @default(cuid())
  userId         String
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  title          String
  targetLanguage String?
  isMastered     Boolean        @default(false)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  journalEntries JournalEntry[]

  @@unique([userId, title, targetLanguage])
}

model JournalEntry {
  id             String    @id @default(cuid())
  authorId       String
  author         User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  topicId        String
  topic          Topic     @relation(fields: [topicId], references: [id], onDelete: Cascade)
  content        String    @db.Text
  aidsUsage      Json?
  targetLanguage String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  analysis       Analysis?
}

model Analysis {
  id            String    @id @default(cuid())
  entryId       String    @unique
  entry         JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  grammarScore  Int
  phrasingScore Int
  vocabScore    Int
  feedbackJson  String    @db.Text
  rawAiResponse String    @db.Text
  createdAt     DateTime  @default(now())
  mistakes      Mistake[]
}

model Mistake {
  id               String            @id @default(cuid())
  analysisId       String
  analysis         Analysis          @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  type             String
  originalText     String            @db.Text
  correctedText    String            @db.Text
  explanation      String            @db.Text
  createdAt        DateTime          @default(now())
  srsReviewItems   SrsReviewItem[]
  practiceAttempts PracticeAttempt[]
}

model SrsReviewItem {
  id             String      @id @default(cuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type           SrsItemType
  frontContent   String
  backContent    String
  context        String?
  mistakeId      String?
  mistake        Mistake?    @relation(fields: [mistakeId], references: [id], onDelete: Cascade)
  targetLanguage String?
  nextReviewAt   DateTime
  lastReviewedAt DateTime?
  interval       Int         @default(1)
  easeFactor     Float       @default(2.5)
  createdAt      DateTime    @default(now())
}

model SuggestedTopic {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title          String
  targetLanguage String
  createdAt      DateTime @default(now())

  @@unique([userId, title, targetLanguage])
}

model PracticeAttempt {
  id               String   @id @default(cuid())
  mistakeId        String
  mistake          Mistake  @relation(fields: [mistakeId], references: [id], onDelete: Cascade)
  userId           String
  taskPrompt       String   @db.Text
  expectedAnswer   String   @db.Text
  userAnswer       String   @db.Text
  aiEvaluationJson String   @db.Text
  isCorrect        Boolean
  score            Float?
  createdAt        DateTime @default(now())

  @@index([mistakeId])
  @@index([userId])
}

model ProcessedWebhook {
  id          String   @id @default(cuid())
  eventId     String   @unique
  type        String
  processedAt DateTime @default(now())
  createdAt   DateTime @default(now())
}
```

## 8. Development Epics & User Stories

### **Epic 1: User Onboarding & Profile Configuration**

- **LS-001: Account Creation:** Sign up via email/password.
- **LS-002: Initial Profile Setup:** Wizard to define target language and native language.
- **LS-003: Self-Assessed Skill Level:** User selects their approximate CEFR level.

### **Epic 2: The Core Writing & Translation Experience**

- **LS-006: Starting a New Entry:** Choose a suggested topic, generate a new one, or select "Free Write".
- **LS-007: Contextual Translation Tooltip:** As a user, I can select any text within the application to get an instant, context-aware translation and explanation in a tooltip.
- **LS-008: Proactive AI Autocomplete:** As a user, when I pause writing, the AI suggests a sentence completion. (Free: part of daily interaction limit, Pro: Unlimited).
- **LS-022: AI-Generated Titles for Free-Writes:** The system automatically creates a title for free-write entries upon submission.
- **LS-029: Standalone Translator Page:** As a user, I can navigate to a dedicated Translator page to quickly translate text and view a detailed, sentence-by-sentence breakdown with grammatical tips.
- **LS-030: Add Translation Segments to SRS:** As a user on the Translator page, I can add any translated sentence segment directly to my study deck.

### **Epic 3: AI-Powered Analysis & Feedback**

- **LS-010: Viewing Post-Entry Analysis:** See a color-coded breakdown of the submitted entry after a short processing time.
- **LS-011: Granular Feedback Categories:** Get specific feedback on Grammar, Phrasing, Vocabulary Choice, and what I did well (Strengths).
- **LS-013: Creating SRS Flashcards from Feedback:** I can easily add identified mistakes, translations, or failed practice items to my personal study deck.

### **Epic 4: Interactive Mistake Practice**

- **LS-031: Start Practice Session:** As a user, after viewing a mistake, I can start an interactive practice session to drill down on that specific concept.
- **LS-032: Receive Dynamic Exercises:** As a user, the practice session provides me with new exercises (e.g., fill-in-the-blank, translation) tailored to my mistake.
- **LS-033: Get Instant Practice Feedback:** As a user, my practice answers are instantly evaluated by AI, telling me if I'm correct and providing a score.
- **LS-034: Add Failed Practice to SRS:** As a user, if I fail a practice exercise, I can add it to my study deck for future review.

### **Epic 5: Personalized Spaced Repetition System (SRS) Study**

- **LS-014: Daily SRS Review Session:** Dashboard prompts for a daily study session with due cards. (Free: 10 reviews/day, Pro: Unlimited).
- **LS-015: Interactive Flashcard Review:** Review cards and self-report recall to update the SRS algorithm.
- **LS-016: Dynamic Card Content:** Cards show the rule/word, the original incorrect sentence, and the corrected version for full context.

### **Epic 6: Comprehensive Analytics & Adaptive Progression**

- **LS-018: Comprehensive Analytics Dashboard:** [PRO] View interactive charts for proficiency over time, sub-skill scores, and proficiency forecasts.
- **LS-019: Journal History:** Browse all past entries and revisit their AI analysis.
- **LS-020: Adaptive Topic Suggestion:** The engine suggests new topics based on the user's proficiency.
- **LS-021: Periodic Progress Reports:** Optional weekly summary emails to boost motivation.
- **LS-035: Challenging Concepts:** [PRO] As a Pro user, my dashboard highlights concepts I struggle with most in practice sessions, allowing me to start a new practice session with one click.

### **Epic 7: Monetization & Billing**

- **LS-023: Viewing Pricing & Tiers:** A clear pricing page comparing features across different tiers.
- **LS-024: Upgrading via Stripe Checkout:** A seamless and secure upgrade process handled by Stripe Checkout.
- **LS-025: Managing Subscription:** Users can manage billing, view invoices, or cancel via the Stripe Customer Portal.

### **Epic 8: System Resilience & Error Handling**

- **LS-SYS-004: Tiered Rate Limiting System:** The system implements multiple rate limiting strategies:
  - **Authentication:** 10 requests per minute per IP for login/registration endpoints.
  - **AI Features:** Free users have a shared limit of 5 AI interactions per day (autocomplete, translate, practice). Pro users are unlimited.
  - **SRS Reviews:** Free users can review 10 cards per day. Pro users are unlimited.
- **LS-SYS-005: AI Analysis Retry Logic:** If an AI analysis call fails, the system will automatically retry.
- **LS-SYS-006: Failed Analysis User Notification:** If analysis fails permanently, the user sees a notification with an option to manually trigger it again.
- **LS-SYS-007: Stripe Webhook Idempotency:** The backend handles webhooks idempotently.

### **Epic 9: Account Management & Compliance**

- **LS-026: User Data Export:** As a user, I can request a JSON export of all my journal entries and analyses.
- **LS-027: Account Deletion:** As a user, I can initiate account deletion, which is finalized after a 14-day grace period.
- **LS-028: Cookie Consent:** As a user, I am presented with a cookie consent banner.

### **Epic 10: Admin & Support Tooling**

- **LS-ADM-001: User Lookup:** As an admin, I can search for a user by email to view their profile and subscription tier.
- **LS-ADM-002: View User Entries & Analyses:** As an admin, I can view a user's journal entries and the status of their AI analysis.
- **LS-ADM-003: Manual Subscription Management:** As an admin, I can manually override a user's subscription tier.

## 9. Development & Compliance Practices

- **Code Quality:** `ESLint` is enforced via `eslint.config.mjs`.
- **Environment Management:** Secrets (`DATABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, etc.) are managed securely through Vercel's environment variables.
- **Local Development Environment:** The project includes a `Dockerfile` and `docker-compose.yml` for running the application and database in a containerized setup.
- **Testing Strategy:** The project is configured with Jest for unit/integration testing and Playwright for end-to-end testing to ensure long-term stability.
- **Data Security:** All sensitive user-generated content (journal entries, AI feedback, practice answers) is encrypted at rest in the database using AES-256-GCM. Encryption and decryption are handled at the application layer via `src/lib/encryption.ts`.
- **Compliance & User Trust:**
  - **Cookie Consent:** A GDPR-compliant cookie consent banner is implemented.
  - **Data Privacy:** A clear Privacy Policy details how user data is used for AI processing, with strict controls in place. Users have rights to data export and deletion.