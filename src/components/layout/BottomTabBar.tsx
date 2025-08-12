"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Book, Brain, Languages, Settings, BookText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/journal", label: "Journal", icon: Book },
  { href: "/read", label: "Read", icon: BookText },
  { href: "/study", label: "Study", icon: Brain },
  { href: "/translator", label: "Translator", icon: Languages },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-t border-border z-40">
      <div className="flex justify-around items-start h-full pt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full transition-colors h-full",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-caption-2">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}