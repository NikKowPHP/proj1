"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="bg-background text-foreground">
      <section className="text-center py-20 px-4 sm:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-4">
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

      <div className="container mx-auto pb-20 px-4">
        <Card className="max-w-3xl mx-auto bg-secondary/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle>{t("disclaimerTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-center text-muted-foreground">
            <p>{t("disclaimerContent1")}</p>
            <p
              dangerouslySetInnerHTML={{
                __html: t.raw("disclaimerContent2"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
