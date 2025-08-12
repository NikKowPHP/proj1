# Translator Page: Dual-Request Strategy

This document outlines the dual-request architecture used on the Translator page to optimize user experience by providing both speed and detailed analysis.

## The Challenge

When a user submits text for translation, two distinct needs must be met:

1.  **Speed**: The user expects to see the translated text almost immediately.
2.  **Depth**: For learning purposes, the user benefits from a more detailed, sentence-by-sentence breakdown with grammatical or idiomatic explanations.

A single AI model call that performs both translation and deep analysis is often slower than a simple translation. Forcing the user to wait for the full analysis to complete before seeing any results leads to a poor user experience.

## The Solution: Parallel Processing

To address both needs efficiently, the Translator page client (`src/app/translator/page.tsx`) initiates two simultaneous, independent API requests when the "Translate" button is clicked:

### 1. The Fast Path: Immediate Translation

-   **Endpoint**: `/api/ai/translate`
-   **Service**: `CompositeTranslationService` (`src/lib/ai/composite-translation.service.ts`)
-   **AI Model**: Cerebras (primary) with a Groq fallback.
-   **Purpose**: This service is optimized for one task: direct text translation. It's designed to be as fast as possible.
-   **User Impact**: The result from this API call populates the main "Translation" text area, providing the user with immediate feedback.

### 2. The Detailed Path: In-Depth Breakdown

-   **Endpoint**: `/api/ai/translate-breakdown`
-   **Service**: `GeminiQuestionGenerationService` (`src/lib/ai/gemini-service.ts`)
-   **AI Model**: Google Gemini.
-   **Purpose**: This service uses a more powerful model to perform a complex multi-step task:
    -   Translate the full text.
    -   Break the source text into smaller, pedagogically useful segments (chunks).
    -   Translate each individual segment.
    -   Provide a brief explanation for each segment.
-   **User Impact**: The results from this API call populate the "Translation & Breakdown" section with individual segment cards. This content appears after the main translation is already visible, enhancing the page progressively without blocking the user.

This dual-request strategy ensures a responsive and valuable user experience, delivering immediate results while enriching the interface with deeper learning aids as they become available.