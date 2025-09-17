"use client";

import Image from "next/image";
import { LanguageSwitcher } from "./LanguageSwitcher";

// This component is color-agnostic. The parent container will set the text color.
export function AppHeaderContent() {
  return (
    <div className="flex justify-between items-start">
      <div>
        <Image
          src="/onkono-logo.png"
          alt="ONKONO Logo"
          width={150}
          height={75}
          className="w-32 md:w-40"
        />
        <p className="text-red-600 text-base mt-1">
          Easy questions to answer about your health.
        </p>
      </div>
      <div className="sm:hidden">
 <LanguageSwitcher />
      </div>
     
    </div>
  );
}
