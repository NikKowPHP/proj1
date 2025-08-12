import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AssessmentState {
  answers: Record<string, string>;
  currentStep: number;
  totalSteps: number;
  setAnswer: (questionId: string, answer: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTotalSteps: (count: number) => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      answers: {},
      currentStep: 0,
      totalSteps: 0,
      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        })),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
        })),
      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
      setTotalSteps: (count) => set({ totalSteps: count }),
      reset: () => set({ answers: {}, currentStep: 0 }),
    }),
    {
      name: "assessment-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);