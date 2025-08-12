import {
  useEditor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { useSubmitJournal, useUserProfile, useGenerateImagePrompt } from "@/lib/hooks/data";
import {
  useStuckWriterEffect,
  useAutocompleteEffect,
} from "@/lib/hooks/editor";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Lightbulb, Languages, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Extension } from "@tiptap/core";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/lib/stores/language.store";
import { TranslatorDialog } from "./TranslatorDialog";
import { useSelection } from "@/lib/hooks/ui/useSelection";
import { TranslationTooltip } from "./ui/TranslationTooltip";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import { GuidedPopover } from "./ui/GuidedPopover";
import { logger } from "@/lib/logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Spinner from "./ui/Spinner";
import Image from "next/image";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { Label } from "./ui/label";
import { useMutation } from "@tanstack/react-query";

type AidUsageType =
  | "sentence_starter"
  | "translator_dialog_apply"
  | "translator_dialog_translate"
  | "translation_tooltip_view"
  | "stuck_helper_view";

interface AidUsageEvent {
  type: AidUsageType;
  details: any;
}

// --- WritingAids Sub-component (Now simplified) ---
interface WritingAidsProps {
  topicTitle: string;
  topicDescription?: string;
  editor: any; // TipTap Editor instance
  containerRef: React.Ref<HTMLDivElement>;
  onAidUsed: (event: AidUsageEvent) => void;
}

const WritingAids: React.FC<WritingAidsProps> = ({
  topicTitle,
  topicDescription,
  editor,
  containerRef,
  onAidUsed,
}) => {
  const [isTranslateNew, markTranslateAsSeen] = useFeatureFlag(
    "highlight_text_translation",
  );

  const {
    data: aids,
    mutate: fetchAids,
    isPending,
  } = useMutation({
    mutationFn: (topic: string) =>
      fetch("/api/journal/helpers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          targetLanguage: useLanguageStore.getState().activeTargetLanguage,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorBody = await res
            .json()
            .catch(() => ({ error: "An unknown error occurred" }));
          throw new Error(
            errorBody.error || `Request failed with status ${res.status}`,
          );
        }
        return res.json();
      }),
    onError: (error: Error) => {
      logger.warn("Could not fetch writing aids for journal editor.", {
        error: error.message,
      });
    },
  });

  useEffect(() => {
    if (
      topicTitle &&
      topicTitle !== "Free Write" &&
      useLanguageStore.getState().activeTargetLanguage
    ) {
      fetchAids(topicTitle);
    }
  }, [topicTitle, fetchAids]);

  if (
    topicTitle === "Free Write" ||
    (!isPending && !aids && !topicDescription)
  ) {
    return null;
  }

  const insertSentenceStarter = () => {
    if (editor && aids?.sentenceStarter) {
      editor.chain().focus().setContent(aids.sentenceStarter).run();
      onAidUsed({
        type: "sentence_starter",
        details: {
          text: aids.sentenceStarter,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const insertVocab = (vocab: string) => {
    if (editor) {
      editor.chain().focus().insertContent(` ${vocab} `).run();
    }
  };

  return (
    <div ref={containerRef} className="no-touch-callout">
      <Card className="mb-4 bg-secondary/30">
        <CardHeader>
          <div>
            <GuidedPopover
              isOpen={isTranslateNew}
              onDismiss={markTranslateAsSeen}
              title="Translate Anything"
              description="You can select any text on this platform, like this topic title, to get an instant translation."
            >
              <CardTitle className="text-lg">
                Topic:{" "}
                <span className="underline decoration-dashed decoration-1 decoration-[color:var(--interactive-underline)] underline-offset-4 cursor-help">
                  {topicTitle}
                </span>
              </CardTitle>
              {topicDescription && (
                <p className="text-sm text-muted-foreground mt-2 underline decoration-dashed decoration-1 decoration-[color:var(--interactive-underline)] underline-offset-4 cursor-help">
                  {topicDescription}
                </p>
              )}
            </GuidedPopover>
          </div>
        </CardHeader>
        {aids && (
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Sentence Starter
                </h4>
                <p className="italic text-foreground">
                  <span className="underline decoration-dashed decoration-1 decoration-[color:var(--interactive-underline)] underline-offset-4 cursor-help">
                    "{aids.sentenceStarter}"
                  </span>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={insertSentenceStarter}
                    className="ml-2"
                  >
                    Use this
                  </Button>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Vocabulary to Try
                </h4>
                <div className="flex flex-wrap gap-2">
                  {aids.suggestedVocab.map((vocab: string) => (
                    <Button
                      key={vocab}
                      size="sm"
                      variant="outline"
                      onClick={() => insertVocab(vocab)}
                    >
                      {vocab}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
        {isPending && !aids && (
          <CardContent>
            <Skeleton className="h-5 w-1/3 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// --- Stuck Writer Helper UI (Now simplified) ---
const StuckWriterHelper = ({
  suggestions,
  onDismiss,
  containerRef,
}: {
  suggestions: string[];
  onDismiss: () => void;
  containerRef: React.Ref<HTMLUListElement>;
}) => {
  const [isTranslateNew, markTranslateAsSeen] = useFeatureFlag(
    "highlight_text_translation",
  );

  return (
    <Card className="mt-4 p-4 border-primary/50 bg-secondary/30 relative animate-in fade-in slide-in-from-top-2 duration-500">
      <CardHeader className="p-0 pb-2 flex-row justify-between items-center">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Need a nudge?
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <GuidedPopover
          isOpen={isTranslateNew}
          onDismiss={markTranslateAsSeen}
          title="Translate Suggestions"
          description="Don't understand a suggestion? Just select the text to translate it."
        >
          <ul
            ref={containerRef}
            className="space-y-1 text-sm text-muted-foreground list-disc pl-5 underline decoration-dashed decoration-1 decoration-[color:var(--interactive-underline)] underline-offset-4 cursor-help no-touch-callout"
          >
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </GuidedPopover>
      </CardContent>
    </Card>
  );
};

// --- TipTap Extension for Tab Key ---
const TabHandler = Extension.create({
  name: "tabHandler",
  addOptions() {
    return {
      onTab: () => false,
    };
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => this.options.onTab(),
    };
  },
});

// --- Modified JournalEditor Component ---
interface JournalEditorProps {
  topicTitle?: string;
  topicDescription?: string;
  isOnboarding?: boolean;
  onOnboardingSubmit?: (journalId: string) => void;
  onFirstUpdate?: () => void;
  mode?: string; // Controlled mode from parent
}

export function JournalEditor({
  topicTitle = "Free Write",
  topicDescription,
  isOnboarding = false,
  onOnboardingSubmit,
  onFirstUpdate,
  mode: modeProp,
}: JournalEditorProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [aidsUsage, setAidsUsage] = useState<AidUsageEvent[]>([]);
  const router = useRouter();
  const onFirstUpdateCalled = useRef(false);
  const [imageTopic, setImageTopic] = useState<{ id: string, title: string, imageUrl: string } | null>(null);

  const [internalMode, setInternalMode] = useState("free_write");
  const mode = modeProp || internalMode;
  const generateImagePromptMutation = useGenerateImagePrompt();
  const analytics = useAnalytics();

  const writingAidsRef = useRef<HTMLDivElement>(null);
  const stuckHelperRef = useRef<HTMLUListElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { data: userProfile } = useUserProfile();
  const { activeTargetLanguage } = useLanguageStore();

  const writingAidsSelection = useSelection(writingAidsRef);
  const stuckHelperSelection = useSelection(stuckHelperRef);
  const editorSelection = useSelection(editorContainerRef, {
    disableTapToSelect: true,
  });

  const getLanguageName = (value: string | null | undefined): string => {
    if (!value) return "";
    const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
    return lang ? lang.name : value;
  };

  const onTabRef = useRef<() => boolean>(() => false);

  const handleAidUsed = useCallback((event: AidUsageEvent) => {
    setAidsUsage((prev) => [...prev, event]);
  }, []);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: isOnboarding
            ? "Write your introduction here..."
            : topicTitle && topicTitle !== "Free Write"
              ? `Start writing about "${topicTitle}"...`
              : "Start with a free write entry...",
        }),
        TabHandler.configure({
          onTab: () => onTabRef.current(),
        }),
      ],
      content: "",
      editorProps: {
        attributes: {
          class:
            "prose dark:prose-invert prose-sm sm:prose-lg mx-auto focus:outline-none p-4 min-h-[200px] bg-background text-foreground",
        },
      },
      onUpdate: () => {
        if (onFirstUpdate && !onFirstUpdateCalled.current) {
          onFirstUpdate();
          onFirstUpdateCalled.current = true;
        }
      },
      immediatelyRender: false, // Fix for SSR hydration mismatch
    },
    [topicTitle, isOnboarding],
  );

  const { suggestion, setSuggestion } = useAutocompleteEffect(editor);

  const onSuggestionsShown = useCallback(
    (suggestions: string[]) => {
      handleAidUsed({
        type: "stuck_helper_view",
        details: {
          suggestions,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [handleAidUsed],
  );

  const { stuckSuggestions, showStuckUI, setShowStuckUI } =
    useStuckWriterEffect(editor, topicTitle, onSuggestionsShown);

  const submitJournalMutation = useSubmitJournal({
    onSuccess: (journal) => {
      if (isOnboarding && onOnboardingSubmit) {
        onOnboardingSubmit(journal.id);
      } else {
        editor?.commands.clearContent();
        setAidsUsage([]);
        if (mode === "describe_image") {
          setImageTopic(null);
          if (!modeProp) setInternalMode("free_write");
        }
        router.push(`/journal/${journal.id}`);
      }
    },
  });

  useEffect(() => {
    onTabRef.current = () => {
      if (suggestion) {
        editor?.chain().focus().insertContent(suggestion).run();
        setSuggestion(null);
        return true;
      }
      return false;
    };
  }, [suggestion, editor, setSuggestion]);

  const handleModeChange = (newMode: string) => {
    if (!modeProp) {
      setInternalMode(newMode);
      analytics.capture("Journal Mode Selected", { mode: newMode });
      if (newMode === "describe_image") {
        setImageTopic(null); // Clear previous image
        generateImagePromptMutation.mutate(undefined, {
          onSuccess: (data) => setImageTopic(data),
        });
      }
    }
  };

  const handleNewImage = () => {
    generateImagePromptMutation.mutate(undefined, {
      onSuccess: (data) => {
        setImageTopic(data);
        editor?.commands.clearContent();
      },
    });
  };

  const handleSubmit = async () => {
    if (!editor) return;
    const content = editor.getText();
    if (content.trim().length < 50) {
      setStatusMessage("Please write at least 50 characters before submitting.");
      return;
    }
    setStatusMessage("");

    const payload = {
      content,
      topicTitle: mode === "describe_image" && imageTopic ? imageTopic.title : topicTitle,
      aidsUsage,
      mode,
    };

    submitJournalMutation.mutate(payload);
  };

  const handleApplyTranslation = (text: string) => {
    editor
      ?.chain()
      .focus()
      .insertContent(" " + text)
      .run();
    handleAidUsed({
      type: "translator_dialog_apply",
      details: { text, timestamp: new Date().toISOString() },
    });
  };

  const handleTranslationTooltipSuccess = useCallback(
    (details: {
      selectedText: string;
      translation: string;
      explanation: string;
    }) => {
      handleAidUsed({
        type: "translation_tooltip_view",
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [handleAidUsed],
  );

  if (!editor) {
    return null;
  }

  const shouldEnableTranslation =
    userProfile?.nativeLanguage && activeTargetLanguage;

  const activeSelection = [
    writingAidsSelection,
    stuckHelperSelection,
    editorSelection,
  ].find((s) => s.isVisible && s.selectedText);

  return (
    <div className="flex flex-col">
      {shouldEnableTranslation && activeSelection && (
        <TranslationTooltip
          selectedText={activeSelection.selectedText}
          contextText={activeSelection.contextText}
          sourceLang={getLanguageName(activeTargetLanguage)}
          targetLang={getLanguageName(userProfile.nativeLanguage)}
          position={activeSelection.position}
          onClose={activeSelection.close}
          onTranslationSuccess={handleTranslationTooltipSuccess}
        />
      )}

      {!modeProp && (
        <div className="flex items-center gap-2 mb-4">
          <Label>Mode:</Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free_write">Free Write</SelectItem>
              <SelectItem value="describe_image">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Describe Image</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {mode === 'describe_image' && (
            <Button variant="outline" size="sm" onClick={handleNewImage} disabled={generateImagePromptMutation.isPending}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {mode === "describe_image" && (
        <div className="mb-4">
          {generateImagePromptMutation.isPending && <Skeleton className="w-full h-64 rounded-lg" />}
          {generateImagePromptMutation.isError && (
            <div className="w-full h-64 rounded-lg bg-destructive/10 border border-destructive/20 flex flex-col items-center justify-center text-center p-4">
              <p className="text-destructive font-semibold">Could not load image</p>
              <p className="text-sm text-destructive/80 mb-2">Please try again or select another mode.</p>
              <Button onClick={handleNewImage} variant="destructive" size="sm">Retry</Button>
            </div>
          )}
          {imageTopic && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image src={imageTopic.imageUrl} alt={imageTopic.title} layout="fill" objectFit="cover" />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs">
                {imageTopic.title}
              </div>
            </div>
          )}
        </div>
      )}

      {(topicTitle !== "Free Write" || topicDescription) && (
        <WritingAids
          topicTitle={topicTitle}
          topicDescription={topicDescription}
          editor={editor}
          containerRef={writingAidsRef}
          onAidUsed={handleAidUsed}
        />
      )}
      
      {showStuckUI && stuckSuggestions && (
        <StuckWriterHelper
          suggestions={stuckSuggestions}
          onDismiss={() => setShowStuckUI(false)}
          containerRef={stuckHelperRef}
        />
      )}
      <div className="border rounded-lg overflow-hidden mt-4">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex gap-1 p-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md ">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded ${editor.isActive("bold") ? "bg-accent" : ""} hover:bg-accent`}>Bold</button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded ${editor.isActive("italic") ? "bg-accent" : ""} hover:bg-accent`}>Italic</button>
            </div>
          </BubbleMenu>
        )}
        {editor && suggestion && (
          <FloatingMenu editor={editor} shouldShow={() => suggestion !== null} tippyOptions={{ duration: 100, placement: "bottom-start" }}>
            <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
              <span className="text-muted-foreground">{suggestion}</span>
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => { editor.chain().focus().insertContent(suggestion).run(); setSuggestion(null); }}>Accept (Tab)</Button>
            </div>
          </FloatingMenu>
        )}
        <div ref={editorContainerRef} className="no-touch-callout">
          <EditorContent editor={editor} />
        </div>
        <div className="p-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={submitJournalMutation.isPending}>
              {submitJournalMutation.isPending ? (<><Spinner size="sm" className="mr-2" /> Submitting...</>) : ("Submit for Analysis")}
            </Button>
            <Button variant="outline" onClick={() => setIsTranslatorOpen(true)}>
              <Languages className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Translate</span>
            </Button>
          </div>
          {statusMessage && <p className="mt-2 sm:mt-0 text-sm text-muted-foreground">{statusMessage}</p>}
        </div>
      </div>
      <TranslatorDialog open={isTranslatorOpen} onOpenChange={setIsTranslatorOpen} onApplyTranslation={handleApplyTranslation} onTranslate={(details) => {
        handleAidUsed({
          type: "translator_dialog_translate",
          details: { ...details, timestamp: new Date().toISOString() },
        });
      }} />
    </div>
  );
}