"use client";
import { useTranslations } from "next-intl";
import { AppHeaderContent } from "@/components/AppHeaderContent";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="p-4 bg-white text-black md:hidden border-b">
        <AppHeaderContent />
      </header>

      <div className="flex-grow md:grid md:grid-cols-2">
        {/* Left Column (Desktop-Only, White Background) */}
        <div className="hidden md:flex flex-col justify-start p-12 bg-white text-black">
          <AppHeaderContent />
        </div>

        {/* Right Column / Main Content */}
        <main className="w-full p-6 md:p-12 overflow-y-auto">
          <div className="prose dark:prose-invert max-w-4xl w-full mx-auto">
            <Button
              variant="ghost"
              className="pl-0 mb-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToHome")}
            </Button>
            <h1>{t("title")}</h1>
            <p>{t("lastUpdated")}</p>

            <p>{t("intro")}</p>

            <h2>{t("anonymityTitle")}</h2>
            <p>{t("anonymityIntro")}</p>
            <ul>
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("anonymityPoint1") }}
              />
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("anonymityPoint2") }}
              />
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("anonymityPoint3") }}
              />
            </ul>

            <h2>{t("processingTitle")}</h2>
            <p>{t("processingIntro")}</p>
            <ul>
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("processingPoint1") }}
              />
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("processingPoint2") }}
              />
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("processingPoint3") }}
              />
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
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("thirdPartyPoint1") }}
              />
              <li
                dangerouslySetInnerHTML={{ __html: t.raw("thirdPartyPoint2") }}
              />
            </ul>

            <h2>{t("choicesTitle")}</h2>
            <p>{t("choicesContent")}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
