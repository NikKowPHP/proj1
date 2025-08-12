import type { JournalEntry, Topic, Analysis, Mistake } from "@prisma/client";

// From api-client.service.ts
export interface ProfileData {
  nativeLanguage: string;
  targetLanguage: string;
  writingStyle: string;
  writingPurpose: string;
  selfAssessedLevel: string;
}
export type ProfileUpdateData = Partial<ProfileData> & {
  newTargetLanguage?: string;
};
export interface OnboardingData extends ProfileData {}

// From generation-service.ts
export interface GenerationContext {
  role: string;
  difficulty: string;
  count: number;
}
export interface EvaluationContext {
  question: string;
  userAnswer: string;
  idealAnswerSummary: string;
}
export interface AudioEvaluationContext {
  question: string;
  idealAnswerSummary: string;
  audioBuffer: Buffer;
  mimeType: string;
}
export interface EvaluationResult {
  score: number;
  feedbackSummary: string;
  evaluation: {
    accuracy: string;
    depthAndClarity: string;
    completeness: string;
  };
  overallImpression: string;
  refinedExampleAnswer: string;
}
export interface RoleSuggestion {
  name: string;
  description: string;
}
export interface JournalAnalysisResult {
  grammarScore: number;
  phrasingScore: number;
  vocabularyScore: number;
  feedback: string;
  mistakes: Array<{
    type: string;
    original: string;
    corrected: string;
    explanation: string;
  }>;
  highlights: Array<{
    start: number;
    end: number;
    type: "grammar" | "phrasing" | "vocabulary";
  }>;
  overallSummary?: string;
  strengths?: Array<{
    type: string;
    text: string;
    explanation: string;
  }>;
}
export interface JournalingAids {
  sentenceStarter: string;
  suggestedVocab: string[];
}
export interface StuckWriterContext {
  topic: string;
  currentText: string;
  targetLanguage: string;
}
export interface GeneratedQuestion {
  question: string;
  ideal_answer_summary: string;
  topics: string[];
  explanation?: string;
  difficulty?: string;
}
export interface DrillDownContext {
  original: string;
  corrected: string;
  explanation: string;
  targetLanguage: string;
  nativeLanguage: string;
  previousAttempts?: {
    taskPrompt: string;
    userAnswer: string;
    feedback: string;
  }[];
  existingTasks?: string[];
}
export interface DrillDownResult {
  practiceSentences: { type: string; task: string; answer: string }[];
}
export interface EvaluateDrillDownAnswerPayload {
  mistakeId: string;
  taskPrompt: string;
  expectedAnswer: string;
  userAnswer: string;
  targetLanguage: string;
}
export interface EvaluateDrillDownAnswerResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  correctedAnswer: string;
}
export interface EvaluateUserSentencePayload {
  sentence: string;
  concept: string;
  targetLanguage: string;
}
export interface EvaluateUserSentenceResult {
  isCorrect: boolean;
  feedback: string;
}
export interface UserGoals {
  weeklyJournals?: number;
}

// From admin/users/[id]/page.tsx
export type JournalEntryWithRelations = JournalEntry & {
  topic: Topic;
  analysis: (Omit<Analysis, "rawAiResponse" | "feedbackJson"> & {
    mistakes: Mistake[];
    rawAiResponse: JournalAnalysisResult | null;
    feedbackJson: string | null;
  }) | null;
};

export interface GeminiAiConfig {
  responseMimeType: string;
}

export interface SrsDrillItem {
  id: string;
  frontContent: string;
  backContent: string;
  context: string | null;
  type: string; // Corresponds to SrsItemType enum values
  targetLanguage: string | null;
  interval: number;
  easeFactor: number;
}

export type ReadingLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface WritingTask {
  title: string;
  prompt: string;
}

export interface StructuredWritingTasks {
  summary: WritingTask;
  comprehension: WritingTask;
  creative: WritingTask;
}

// AI Tutor Chat Types
export interface TutorChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorChatPayload {
  mistakeId: string;
  mistakeContext: {
    original: string;
    corrected: string;
    explanation: string;
  };
  chatHistory: TutorChatMessage[];
  targetLanguage: string;
  nativeLanguage: string;
}

export interface UserProficiencySnapshot {
  averageScore: number;
  trend: "improving" | "stable" | "declining" | "new";
  challengingConcepts: {
    explanation: string;
  }[];
}

export interface JournalTutorContext {
  journal: {
    title: string;
    content: string;
    targetLanguage: string;
  };
  analysis: JournalAnalysisResult;
  snapshot: UserProficiencySnapshot;
  nativeLanguage: string;
}

export interface DashboardTutorContext {
  nativeLanguage: string;
  targetLanguage: string;
  goals: UserGoals | null;
  snapshot: UserProficiencySnapshot;
  recentMistakes: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  srsStats: {
    dueToday: number;
    dueThisWeek: number;
    total: number;
  };
}