"use client";
import { useTranslations } from "next-intl";
import { AppHeaderContent } from "@/components/AppHeaderContent";
import { AppFooter } from "@/components/AppFooter";

export default function TermsPage() {
  const t = useTranslations("TermsPage");
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="p-4 bg-background text-foreground md:hidden border-b">
        <AppHeaderContent />
      </header>

      <div className="flex-grow md:grid md:grid-cols-[minmax(300px,_1fr)_2fr]">
        {/* Left Column (Desktop-Only, Gray Background) */}
        <div className="hidden md:flex flex-col justify-start p-12 bg-secondary text-secondary-foreground">
          <AppHeaderContent />
        </div>

        {/* Right Column / Main Content */}
        <main className="w-full p-6 md:p-12 overflow-y-auto">
          <div className="prose dark:prose-invert max-w-4xl w-full mx-auto">
            <h1>{t("title")}</h1>
            <p>{t("lastUpdated")}</p>
            <p>{t("intro")}</p>

            <h2>{t("notMedicalAdviceTitle")}</h2>
            <p>{t("notMedicalAdviceContent")}</p>

            <h2>{t("noWarrantyTitle")}</h2>
            <p>{t("noWarrantyContent")}</p>

            <h2>{t("liabilityTitle")}</h2>
            <p>{t("liabilityContent")}</p>

            <h2>{t("useOfServiceTitle")}</h2>
            <p>{t("useOfServiceContent")}</p>

            <h2>{t("changesToTermsTitle")}</h2>
            <p>{t("changesToTermsContent")}</p>
          </div>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
