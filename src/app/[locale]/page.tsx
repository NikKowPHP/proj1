"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import React from "react";
import { AppHeaderContent } from "@/components/AppHeaderContent";
import { DisclaimerFooterContent } from "@/components/DisclaimerFooterContent";
import { DisclaimerFooterContentMobile } from "@/components/DisclaimerFooterContentMobile";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile-Only Header (White Background) */}
      <header className="p-4 bg-white text-black md:hidden">
        <AppHeaderContent />
      </header>

      {/* Main Container: Becomes a grid on desktop, is a flex container on mobile */}
      <div className="flex flex-grow md:grid md:grid-cols-2">
        {/* Left Column (Desktop-Only, White Background) */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-white text-black">
          <AppHeaderContent />
          <DisclaimerFooterContent />
        </div>

        {/* Right Column / Main Content (Black Background) */}
        <main className="bg-black text-white w-full flex flex-col flex-grow items-center justify-center p-4 text-center pb-24 md:pb-4">
          <div className="max-w-2xl">
            <p className="text-lg sm:text-xl text-muted-foreground">
              {t("description")}
            </p>
            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="rounded-none bg-[#FF3B30] hover:bg-red-700"
              >
                <Link href="/assessment">{t("ctaButton")}</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile-Only Footer (White Background) */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white text-black md:hidden border-t">
        <DisclaimerFooterContentMobile />
      </footer>
    </div>
  );
}
