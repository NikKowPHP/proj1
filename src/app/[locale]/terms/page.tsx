"use client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("TermsPage");
  return (
    <div className="container mx-auto p-4 md:p-8 prose dark:prose-invert max-w-4xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="pl-0">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
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
  );
}
