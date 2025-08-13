"use client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");

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

      <h2>{t("anonymityTitle")}</h2>
      <p>{t("anonymityIntro")}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t.raw("anonymityPoint1") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("anonymityPoint2") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("anonymityPoint3") }} />
      </ul>

      <h2>{t("processingTitle")}</h2>
      <p>{t("processingIntro")}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t.raw("processingPoint1") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("processingPoint2") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("processingPoint3") }} />
      </ul>

      <h2>{t("emailTitle")}</h2>
      <p>{t("emailIntro")}</p>
      <ul>
        <li>{t("emailPoint1")}</li>
        <li>{t("emailPoint2")}</li>
        <li>{t("emailPoint3")}</li>
        <li dangerouslySetInnerHTML={{ __html: t.raw("emailPoint4") }} />
      </ul>

      <h2>{t("thirdPartyTitle")}</h2>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t.raw("thirdPartyPoint1") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("thirdPartyPoint2") }} />
      </ul>
      
      <h2>{t("choicesTitle")}</h2>
      <p>{t("choicesContent")}</p>
    </div>
  );
}
