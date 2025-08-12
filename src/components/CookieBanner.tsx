
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth.store";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "lexity_cookie_consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This check ensures we don't try to access localStorage on the server.
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent === null) {
        setIsVisible(true);
      }
    }
  }, []);

  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const handleConsent = (consent: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COOKIE_CONSENT_KEY, String(consent));
    }
    setIsVisible(false);
  };

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isLoggedInAppView = user && !isAuthPage;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-50",
        isLoggedInAppView ? "bottom-20 md:bottom-0" : "bottom-0",
      )}
    >
      <p className="text-sm text-center sm:text-left">
        We use cookies to enhance your experience. By continuing to visit this
        site you agree to our use of cookies.
      </p>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleConsent(false)}
        >
          Decline
        </Button>
        <Button size="sm" onClick={() => handleConsent(true)}>
          Accept
        </Button>
      </div>
    </div>
  );
}