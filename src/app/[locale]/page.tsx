"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { AlertTriangle, ChevronUp } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const t = useTranslations("HomePage");
  const tFooter = useTranslations("AppFooter");
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDisclaimerToggle = () => {
    setIsAnimating(true);
    setIsDisclaimerOpen(!isDisclaimerOpen);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen bg-white">
      {/* Left Column */}
      <div className="hidden md:flex flex-col justify-between p-12 text-black relative">
         <div className="flex flex-col  gap-2.5">
                 <Image src="/onkono-logo.png" alt="" width={200} height={100}  />
                 <p className=" text-red-600 mb-12">
                   Easy questions to answer about your health.
                 </p>
               </div>

        <div className="absolute bottom-12 left-12 right-12">
          <div className="space-y-4">
            <div
              className="flex items-start gap-4 cursor-pointer transition-all duration-200 "
              onClick={handleDisclaimerToggle}
            >
              <ChevronUp
                className={`h-14 w-13 text-red-600 flex-shrink-0 transition-transform duration-300 ${
                  isDisclaimerOpen ? "rotate-180" : "rotate-0"
                }`}
              />
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 transition-transform duration-300" />
              <div className="transition-all duration-300">
                <h2 className="text-lg font-semibold transition-colors duration-200 hover:text-red-700">
                  {t("disclaimerTitle")}
                </h2>
                <p className="text-xs text-gray-600 mt-2 transition-all duration-300">
                  {t("disclaimerContent1")}
                </p>
                <p
                  className="text-xs text-gray-600 mt-2 transition-all duration-300"
                  dangerouslySetInnerHTML={{
                    __html: t.raw("disclaimerContent2"),
                  }}
                ></p>
              </div>
            </div>
          </div>

          {isDisclaimerOpen && (
            <div
              className={`mt-6 text-xs text-gray-500 flex items-center justify-start flex-wrap gap-4 pl-12 transition-all duration-300 ease-in-out ${
                isAnimating
                  ? "opacity-0 translate-y-2"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <Link
                href="/terms"
                className="hover:underline transition-colors duration-200 hover:text-red-600"
              >
                {tFooter("termsOfService")}
              </Link>
               <Link href="/about" className="hover:underline transition-colors duration-200 hover:text-red-600">
                About Onkono
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <main className="w-full flex flex-col items-center justify-center p-4 md:p-8 bg-black text-white relative">
        <section className="text-center px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("description")}
            </p>
            <div className="mt-10 flex justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-none bg-[#FF3B30] hover:bg-red-700"
              >
                <Link href="/assessment">{t("ctaButton")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
