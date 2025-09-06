"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="container mx-auto px-4 py-6">
  
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="55.000000pt" height="54.000000pt" viewBox="0 0 55.000000 54.000000"
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,54.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M211 519 c-136 -40 -212 -186 -166 -320 21 -59 41 -81 107 -118 98
-56 180 -52 282 12 36 23 55 44 72 81 90 194 -90 404 -295 345z m149 -159
l-75 -69 25 -28 c13 -15 47 -52 74 -80 l50 -53 -152 0 -152 0 0 150 0 150 153
0 152 -1 -75 -69z"/>
</g>
</svg>

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
      