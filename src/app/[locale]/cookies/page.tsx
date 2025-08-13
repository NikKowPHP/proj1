"use client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CookiesPage() {
  const t = useTranslations("CookiesPage");
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
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      <p>{t("lastUpdated")}</p>

      <p>{t("intro1")}</p>
      <p>{t("intro2")}</p>

      <h2>{t("whatAreCookiesTitle")}</h2>
      <p>{t("whatAreCookiesContent")}</p>

      <h2>{t("howWeUseCookiesTitle")}</h2>
      <p>{t("howWeUseCookiesIntro")}</p>

      <h3>{t("essentialCookiesTitle")}</h3>
      <p>{t("essentialCookiesContent")}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t.raw("essentialCookiesPoint1") }} />
      </ul>

      <h3>{t("functionalCookiesTitle")}</h3>
      <p>{t("functionalCookiesContent")}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t.raw("functionalCookiesPoint1") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("functionalCookiesPoint2") }} />
        <li dangerouslySetInnerHTML={{ __html: t.raw("functionalCookiesPoint3") }} />
      </ul>

      <h2>{t("yourChoicesTitle")}</h2>
      <p>{t("yourChoicesContent1")}</p>
      <p>{t("yourChoicesContent2")}</p>

      <h2>{t("moreInfoTitle")}</h2>
      <p>{t("moreInfoContent")}</p>
      <ul>
        <li>
          AllAboutCookies:{" "}
          <a
            href="http://www.allaboutcookies.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://www.allaboutcookies.org/
          </a>
        </li>
        <li>
          Network Advertising Initiative:{" "}
          <a
            href="http://www.networkadvertising.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://www.networkadvertising.org/
          </a>
        </li>
      </ul>
    </div>
  );
}
