
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useSynthesizeSpeech } from "@/lib/hooks/data/useSynthesizeSpeech";
import Spinner from "./Spinner";

const CACHE_VERSION = "v2"; // Increment to invalidate old caches

interface TTSButtonProps {
  text: string;
  lang: string; // BCP-47 language code, e.g., 'en-US'
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, lang }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ttsMutation = useSynthesizeSpeech();

  const cacheKey = `tts-audio-${CACHE_VERSION}-${lang}-${text}`;

  const playAudio = (dataUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Prevent stale onended event from firing after a new audio starts
      audioRef.current.onended = null;
    }
    const audio = new Audio(dataUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = (e) => {
      logger.error("Audio playback error event fired", { e });
      setIsSpeaking(false);
    };

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Playback started. State is handled by the `onplay` event.
        })
        .catch((error) => {
          logger.error("Audio playback was prevented by the browser.", { error });
          setIsSpeaking(false);
        });
    }
  };

  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
      return;
    }

    // 1. Check cache
    try {
      const cachedAudio = localStorage.getItem(cacheKey);
      if (cachedAudio) {
        playAudio(cachedAudio);
        return;
      }
    } catch (error) {
      logger.warn("Could not read from localStorage for TTS cache.", { error });
    }

    // 2. Fetch from API
    ttsMutation.mutate(
      { text, lang },
      {
        onSuccess: (data) => {
          const dataUrl = `data:audio/mpeg;base64,${data.audioContent}`;

          // 3. Cache the result
          try {
            localStorage.setItem(cacheKey, dataUrl);
          } catch (error) {
            logger.warn("Could not write to localStorage for TTS cache.", {
              error,
            });
          }

          // 4. Play audio
          playAudio(dataUrl);
        },
      },
    );
  };

  // Clean up audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleToggleSpeech}
      disabled={ttsMutation.isPending}
      title="Listen to text"
    >
      {ttsMutation.isPending ? (
        <Spinner size="sm" />
      ) : (
        <Volume2
          className={cn(
            "h-4 w-4 transition-colors",
            isSpeaking && "text-primary animate-pulse",
          )}
        />
      )}
    </Button>
  );
};