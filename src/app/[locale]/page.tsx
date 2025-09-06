"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-primary">ONKONO</h1>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <section className="text-center px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("description")}
            </p>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg">
                <Link href="/assessment">{t("ctaButton")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
      