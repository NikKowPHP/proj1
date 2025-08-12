"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { TutorChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import Spinner from "./ui/Spinner";

interface TutorChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle: string;
  contextDescription: React.ReactNode;
  chatHistory: TutorChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function TutorChatDialog({
  isOpen,
  onClose,
  contextTitle,
  contextDescription,
  chatHistory,
  onSendMessage,
  isLoading,
}: TutorChatDialogProps) {
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput);
      setUserInput("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80dvh]">
        <DialogHeader>
          <DialogTitle>{contextTitle}</DialogTitle>
          <DialogDescription className="text-xs">
            {contextDescription}
          </DialogDescription>
        </DialogHeader>
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto space-y-4 p-4 -mx-6"
        >
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col",
                message.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary",
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-secondary rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <Spinner size="sm" />
                <span>Tutor is typing...</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
          <Input
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !userInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}