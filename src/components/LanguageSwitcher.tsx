"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <Select
      onValueChange={onSelectChange}
      defaultValue={locale}
      disabled={isPending}
    >
      <SelectTrigger className="w-auto gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="pl">Polski</SelectItem>
      </SelectContent>
    </Select>
  );
}
      