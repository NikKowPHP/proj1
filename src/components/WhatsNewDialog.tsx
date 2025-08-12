"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Rocket } from "lucide-react";

interface WhatsNewDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function WhatsNewDialog({ isOpen, onDismiss }: WhatsNewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">What's New at Lexity</DialogTitle>
          <DialogDescription className="text-center">
            We've launched powerful new features to accelerate your learning!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>✍️ User-Generated Examples:</strong> Practice a correction by writing your own sentence and getting instant feedback right in the feedback card.
          </p>
          <p>
            <strong>🎯 Goal Setting:</strong> Set weekly journaling goals in your settings to stay motivated and track your consistency.
          </p>
          <p>
            <strong>📖 Read & Write Mode:</strong> Improve comprehension and production at the same time by reading a short passage and writing a summary.
          </p>
          <p>
            <strong>🧠 The Mistake Diary:</strong> All your past mistakes are now cataloged in one place for easy review. Find it on the "Study" page.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onDismiss} className="w-full">
            Explore Features
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}