"use client";

import { usePWAStore } from "@/lib/stores/pwa.store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { usePathname } from "next/navigation";

export function PWAInstallPrompt() {
  const { showInstallBanner, triggerInstallPrompt, dismissInstallPrompt } =
    usePWAStore();
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));
  const isLoggedInAppView = user && !isAuthPage;

  if (!showInstallBanner) {
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
        Install Lexity on your device for a better, app-like experience.
      </p>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={dismissInstallPrompt}
        >
          Not Now
        </Button>
        <Button size="sm" onClick={triggerInstallPrompt}>
          <Download className="h-4 w-4 mr-2" />
          Install
        </Button>
      </div>
    </div>
  );
}