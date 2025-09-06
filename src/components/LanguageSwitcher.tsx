"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Link
        href={pathname}
        locale="pl"
        className={cn(
          "transition-colors hover:text-white",
          locale === "pl" ? "text-white" : "text-gray-500",
        )}
      >
        PL
      </Link>
      <span className="text-gray-500">|</span>
      <Link
        href={pathname}
        locale="en"
        className={cn(
          "transition-colors hover:text-white",
          locale === "en" ? "text-white" : "text-gray-500",
        )}
      >
        EN
      </Link>
    </div>
  );
}
      