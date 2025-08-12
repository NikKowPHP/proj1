
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardPaste, X } from "lucide-react";
import { logger } from "@/lib/logger";

interface TranslationInputProps {
  sourceText: string;
  onTextChange: (text: string) => void;
  isLoading: boolean;
}

export function TranslationInput({
  sourceText,
  onTextChange,
  isLoading,
}: TranslationInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onTextChange(text);
    } catch (err) {
      logger.warn("Failed to read clipboard contents: ", err);
    }
  };

  const handleDiscard = () => {
    onTextChange("");
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder="Enter text to translate..."
        value={sourceText}
        onChange={(e) => onTextChange(e.target.value)}
        rows={8}
        className="pr-24" // Add padding for buttons
        disabled={isLoading}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        {sourceText ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDiscard}
            title="Discard text"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}