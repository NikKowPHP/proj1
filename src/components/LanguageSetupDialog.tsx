"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnboardUser } from "@/lib/hooks/data";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import Spinner from "./ui/Spinner";
import { Label } from "./ui/label";

interface LanguageSetupDialogProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function LanguageSetupDialog({
  isOpen,
  onSuccess,
}: LanguageSetupDialogProps) {
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const { mutate: submitOnboarding, isPending } = useOnboardUser();

  const handleSave = () => {
    const payload = {
      nativeLanguage,
      targetLanguage,
      writingStyle: "Casual",
      writingPurpose: "Personal",
      selfAssessedLevel: "Beginner",
    };
    submitOnboarding(payload, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  const isSaveDisabled = !nativeLanguage || !targetLanguage || isPending;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Welcome to Lexity!</DialogTitle>
          <DialogDescription>
            Let's get you set up. Please select your native language and the
            language you want to learn.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>I speak...</Label>
            <Select onValueChange={setNativeLanguage} value={nativeLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your native language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>I want to learn...</Label>
            <Select onValueChange={setTargetLanguage} value={targetLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a language to learn" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="w-full"
          >
            {isPending && <Spinner size="sm" className="mr-2" />}
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}