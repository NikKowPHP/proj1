"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { AlertTriangle, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

// This component is color-agnostic.
export function DisclaimerFooterContentMobile() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const tHome = useTranslations("HomePage");
  const tFooter = useTranslations("AppFooter");

  return (
    <div className="flex flex-col-reverse gap-4">
      {/* Trigger Bar (will appear at the bottom) */}
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setIsDisclaimerOpen(!isDisclaimerOpen)}
      >
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {tHome("disclaimerTitle")}
            </h2>
            <ChevronUp
              className={`h-6 w-6 text-red-600 flex-shrink-0 transition-transform duration-300 ${
                isDisclaimerOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expandable Content (will appear above the trigger bar) */}
      {isDisclaimerOpen && (
        <div className="space-y-2 text-xs text-gray-500 animate-in fade-in duration-300">
          <p>{tHome("disclaimerContent1")}</p>
          <p
            dangerouslySetInnerHTML={{
              __html: tHome.raw("disclaimerContent2"),
            }}
          />
          <div className="flex items-center gap-4 pt-2">
            <Link href="/terms" className="hover:underline">
              {tFooter("termsOfService")}
            </Link>
            <Link href="/privacy" className="hover:underline">
              {tFooter("privacyPolicy")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
