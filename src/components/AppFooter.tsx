import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "next-intl";

export function AppFooter() {
  const t = useTranslations("AppFooter");

  return (
    <footer className="border-t py-6 bg-secondary/30">
      <div className="container mx-auto px-4 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("privacyPolicy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t("termsOfService")}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
