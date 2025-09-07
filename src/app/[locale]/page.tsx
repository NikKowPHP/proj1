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

      {/* Main Container: Becomes a grid on desktop, is a flex-grow item on mobile */}
      <div className="flex-grow md:grid md:grid-cols-2">
        {/* Left Column (Desktop-Only, White Background) */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-white text-black">
          <AppHeaderContent />
          <DisclaimerFooterContent />
        </div>

        {/* Right Column / Main Content (Black Background) */}
        <main className="bg-black text-white w-full flex flex-col items-center justify-center p-4">
          <section className="text-center px-4">
            <div className="max-w-3xl mx-auto">
              
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("description")}
              </p>
              <div className="mt-10 flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="rounded-none bg-[#FF3B30] hover:bg-red-700"
                >
                  <Link href="/assessment">{t("ctaButton")}</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile-Only Footer (White Background) */}
      <footer className="p-4 bg-white text-black md:hidden">
        <DisclaimerFooterContentMobile />
      </footer>
    </div>
  );
}
      