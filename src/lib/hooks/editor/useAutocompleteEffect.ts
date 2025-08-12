import { useEffect, useState, useRef } from "react";
import { useAutocomplete } from "@/lib/hooks/data";
import type { Editor } from "@tiptap/react";

export const useAutocompleteEffect = (editor: Editor | null) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const autocompleteMutation = useAutocomplete();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setSuggestion(null);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const text = editor.getText();
        if (text.trim().length > 10) {
          autocompleteMutation.mutate(
            { text },
            {
              onSuccess: (data) => setSuggestion(data.completedText),
            },
          );
        }
      }, 1500);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editor, autocompleteMutation]);

  return { suggestion, setSuggestion };
};
