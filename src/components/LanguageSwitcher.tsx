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
          "transition-colors hover:text-foreground",
          locale === "pl" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        PL
      </Link>
      <span className="text-muted-foreground">|</span>
      <Link
        href={pathname}
        locale="en"
        className={cn(
          "transition-colors hover:text-foreground",
          locale === "en" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        EN
      </Link>
    </div>
  );
}
      