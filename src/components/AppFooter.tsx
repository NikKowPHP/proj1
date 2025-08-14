import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppFooter() {
  const t = useTranslations("AppFooter");

  return (
    <footer className="border-t py-6 bg-secondary/30">
      <div className="container mx-auto px-4 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-center sm:text-left">{t("copyright", { year: new Date().getFullYear() })}</p>
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 sm:justify-end sm:gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("privacyPolicy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t("termsOfService")}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
      