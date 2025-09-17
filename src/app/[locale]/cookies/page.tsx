"use client";
import { useTranslations } from "next-intl";
import { AppHeaderContent } from "@/components/AppHeaderContent";
import { AppFooter } from "@/components/AppFooter";

export default function CookiesPage() {
  const t = useTranslations("CookiesPage");
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

            <p>{t("intro1")}</p>
            <p>{t("intro2")}</p>

            <h2>{t("whatAreCookiesTitle")}</h2>
            <p>{t("whatAreCookiesContent")}</p>

            <h2>{t("howWeUseCookiesTitle")}</h2>
            <p>{t("howWeUseCookiesIntro")}</p>

            <h3>{t("essentialCookiesTitle")}</h3>
            <p>{t("essentialCookiesContent")}</p>
            <ul>
              <li
                dangerouslySetInnerHTML={{
                  __html: t.raw("essentialCookiesPoint1"),
                }}
              />
            </ul>

            <h3>{t("functionalCookiesTitle")}</h3>
            <p>{t("functionalCookiesContent")}</p>
            <ul>
              <li
                dangerouslySetInnerHTML={{
                  __html: t.raw("functionalCookiesPoint1"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{
                  __html: t.raw("functionalCookiesPoint2"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{
                  __html: t.raw("functionalCookiesPoint3"),
                }}
              />
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
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
