import { useEffect, useState, useRef } from "react";
import { useStuckWriterSuggestions } from "@/lib/hooks/data";
import type { Editor } from "@tiptap/react";
import { useLanguageStore } from "@/lib/stores/language.store";
import { logger } from "@/lib/logger";

export const useStuckWriterEffect = (
  editor: Editor | null,
  topicTitle: string,
  onSuggestionsShown: (suggestions: string[]) => void,
) => {
  const [stuckSuggestions, setStuckSuggestions] = useState<string[] | null>(
    null,
  );
  const [showStuckUI, setShowStuckUI] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate, isPending } = useStuckWriterSuggestions();

  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const clearTimers = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };

    const startOrResetIdleTimer = () => {
      clearTimers();

      debounceTimer.current = setTimeout(() => {
        if (isPending) {
          return;
        }

        const currentText = editor.getText();
        const shouldTrigger =
          currentText.trim().length > 0 || topicTitle !== "Free Write";

        if (shouldTrigger && activeTargetLanguage) {
          const payload = {
            topic: topicTitle,
            currentText,
            targetLanguage: activeTargetLanguage,
          };

          mutate(payload, {
            onSuccess: (data) => {
              if (data?.suggestions?.length > 0) {
                setStuckSuggestions(data.suggestions);
                setShowStuckUI(true);
                onSuggestionsShown(data.suggestions);

                dismissTimerRef.current = setTimeout(() => {
                  setShowStuckUI(false);
                }, 120000);
              }
            },
            onError: (error) => {
              logger.error("[useStuckWriterEffect] Mutation failed.", {
                error,
              });
            },
          });
        }
      }, 7000);
    };

    editor.on("focus", startOrResetIdleTimer);
    editor.on("update", startOrResetIdleTimer);
    editor.on("blur", clearTimers);

    return () => {
      editor.off("focus", startOrResetIdleTimer);
      editor.off("update", startOrResetIdleTimer);
      editor.off("blur", clearTimers);
      clearTimers();
    };
  }, [
    editor,
    mutate,
    isPending,
    topicTitle,
    activeTargetLanguage,
    onSuggestionsShown,
  ]);

  return { stuckSuggestions, showStuckUI, setShowStuckUI };
};